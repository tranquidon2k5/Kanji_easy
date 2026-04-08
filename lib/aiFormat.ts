import { VocabularyItem } from '@/types/vocabulary';

export class AIFormatError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'AIFormatError';
  }
}

/**
 * Gọi API /api/ai-format để chuyển đổi text thô thành mảng VocabularyItem[]
 * Hiển thị loading state ở phía gọi hàm này
 */
export async function formatWithAI(rawText: string): Promise<Array<Omit<VocabularyItem, 'id'>>> {
  if (!rawText.trim()) {
    throw new AIFormatError('Vui lòng nhập nội dung cần chuyển đổi');
  }

  let response: Response;
  try {
    response = await fetch('/api/ai-format', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: rawText }),
    });
  } catch {
    throw new AIFormatError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Lỗi không xác định' })) as { error?: string };
    throw new AIFormatError(
      errorData.error ?? `Lỗi server: ${response.status}`,
      response.status
    );
  }

  const data = await response.json() as Array<Omit<VocabularyItem, 'id'>>;

  if (!Array.isArray(data)) {
    throw new AIFormatError('Dữ liệu trả về không hợp lệ');
  }

  return data;
}

/**
 * Validate một item từ vựng (chưa có id) — kiểm tra các trường bắt buộc
 */
export function validateVocabItem(item: unknown): item is Omit<VocabularyItem, 'id'> {
  if (!item || typeof item !== 'object') return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.word === 'string' && obj.word.trim().length > 0 &&
    typeof obj.reading === 'string' && obj.reading.trim().length > 0 &&
    typeof obj.hanviet === 'string' && obj.hanviet.trim().length > 0 &&
    typeof obj.meaning === 'string' && obj.meaning.trim().length > 0
  );
}

/**
 * Validate và parse JSON string thành mảng VocabularyItem (chưa có id)
 * Trả về items hợp lệ, bỏ qua items không hợp lệ
 */
export function parseVocabJSON(jsonString: string): Array<Omit<VocabularyItem, 'id'>> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('JSON không hợp lệ. Vui lòng kiểm tra lại định dạng.');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('JSON phải là một mảng (array). Ví dụ: [{"word": "学校", ...}]');
  }

  const valid = parsed.filter((item): item is Omit<VocabularyItem, 'id'> => {
    if (typeof item !== 'object' || item === null) return false;
    const obj = item as Record<string, unknown>;
    return (
      typeof obj.word === 'string' && obj.word.trim() !== '' &&
      typeof obj.reading === 'string' && obj.reading.trim() !== '' &&
      typeof obj.hanviet === 'string' && obj.hanviet.trim() !== '' &&
      typeof obj.meaning === 'string' && obj.meaning.trim() !== ''
    );
  });

  if (valid.length === 0) {
    throw new Error('Không tìm thấy từ vựng hợp lệ nào. Kiểm tra các trường: word, reading, hanviet, meaning.');
  }

  return valid;
}
