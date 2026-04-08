import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { VocabularyItem } from '@/types/vocabulary';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Bạn là trợ lý chuyển đổi dữ liệu từ vựng tiếng Nhật.
Nhiệm vụ: Nhận vào bất kỳ đoạn text nào chứa từ vựng tiếng Nhật và trả về JSON thuần (không có markdown, không có giải thích).

Định dạng output BẮT BUỘC — mảng JSON với các trường:
- word: Chữ Kanji hoặc Kana (bắt buộc)
- reading: Cách đọc hiragana (bắt buộc)
- hanviet: Âm Hán Việt bằng tiếng Việt, ví dụ "Học Hiệu", "Tiên Sinh" (bắt buộc)
- meaning: Nghĩa tiếng Việt ngắn gọn (bắt buộc)

Ví dụ output:
[{"word":"学校","reading":"がっこう","hanviet":"Học Hiệu","meaning":"Trường học"},{"word":"先生","reading":"せんせい","hanviet":"Tiên Sinh","meaning":"Giáo viên, thầy/cô"}]

Quy tắc:
1. Chỉ trả về JSON thuần — KHÔNG có markdown, KHÔNG có backtick, KHÔNG có text giải thích
2. Nếu không tìm thấy từ vựng tiếng Nhật hợp lệ, trả về mảng rỗng: []
3. Bỏ qua các trường không liên quan trong input
4. Âm Hán Việt: dùng tiếng Việt chuẩn, viết hoa chữ đầu mỗi từ`;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { text?: unknown };

    if (typeof body.text !== 'string' || !body.text.trim()) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp nội dung cần chuyển đổi' },
        { status: 400 }
      );
    }

    const rawText = body.text.trim();

    if (rawText.length > 10000) {
      return NextResponse.json(
        { error: 'Nội dung quá dài (tối đa 10.000 ký tự)' },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: rawText,
        },
      ],
    });

    // Extract text content from response
    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json(
        { error: 'AI không trả về dữ liệu hợp lệ' },
        { status: 500 }
      );
    }

    // Parse JSON response
    let parsed: unknown;
    try {
      // Strip any accidental markdown code blocks
      const cleaned = textContent.text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'AI trả về dữ liệu không đúng định dạng JSON' },
        { status: 500 }
      );
    }

    if (!Array.isArray(parsed)) {
      return NextResponse.json(
        { error: 'Dữ liệu trả về phải là một mảng' },
        { status: 500 }
      );
    }

    // Validate and filter items
    const validItems: Array<Omit<VocabularyItem, 'id'>> = parsed.filter(
      (item): item is Omit<VocabularyItem, 'id'> => {
        if (typeof item !== 'object' || item === null) return false;
        const obj = item as Record<string, unknown>;
        return (
          typeof obj.word === 'string' && obj.word.trim() !== '' &&
          typeof obj.reading === 'string' && obj.reading.trim() !== '' &&
          typeof obj.hanviet === 'string' && obj.hanviet.trim() !== '' &&
          typeof obj.meaning === 'string' && obj.meaning.trim() !== ''
        );
      }
    );

    return NextResponse.json(validItems);
  } catch (error) {
    console.error('AI Format error:', error);

    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Đã đạt giới hạn yêu cầu AI. Vui lòng thử lại sau ít phút.' },
          { status: 429 }
        );
      }
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'API key không hợp lệ. Vui lòng kiểm tra cấu hình.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xử lý. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
