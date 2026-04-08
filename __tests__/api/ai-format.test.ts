/**
 * Tests for POST /api/ai-format route handler.
 *
 * We mock the Anthropic SDK entirely so no real network calls are made.
 */

// Must mock before importing the route module
jest.mock('@anthropic-ai/sdk', () => {
  const mockCreate = jest.fn();
  const MockAnthropic = jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  }));
  // Expose a stable reference to mockCreate so tests can access it
  (MockAnthropic as unknown as Record<string, unknown>).__mockCreate = mockCreate;

  class APIError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.name = 'APIError';
      this.status = status;
    }
  }
  MockAnthropic.APIError = APIError;
  return { default: MockAnthropic };
});

import { POST } from '@/app/api/ai-format/route';
import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Helper to grab the mockCreate function from the module mock
function getMockCreate(): jest.Mock {
  return (Anthropic as unknown as Record<string, jest.Mock>).__mockCreate;
}

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/ai-format', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Shared valid AI response helper
function aiResponse(text: string) {
  return {
    content: [{ type: 'text', text }],
  };
}

describe('POST /api/ai-format — input validation', () => {
  it('returns 400 for missing text field', async () => {
    const req = createRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it('returns 400 for empty text string', async () => {
    const req = createRequest({ text: '' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it('returns 400 for whitespace-only text', async () => {
    const req = createRequest({ text: '   ' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when text is a number instead of a string', async () => {
    const req = createRequest({ text: 123 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when text exceeds 10 000 characters', async () => {
    const req = createRequest({ text: 'x'.repeat(10001) });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it('accepts text of exactly 10 000 characters', async () => {
    const mockCreate = getMockCreate();
    const validJson = JSON.stringify([
      { word: '学校', reading: 'がっこう', hanviet: 'Học Hiệu', meaning: 'Trường học' },
    ]);
    mockCreate.mockResolvedValueOnce(aiResponse(validJson));
    const req = createRequest({ text: 'a'.repeat(10000) });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});

describe('POST /api/ai-format — successful responses', () => {
  it('returns 200 with valid vocab array', async () => {
    const mockCreate = getMockCreate();
    const validJson = JSON.stringify([
      { word: '学校', reading: 'がっこう', hanviet: 'Học Hiệu', meaning: 'Trường học' },
    ]);
    mockCreate.mockResolvedValueOnce(aiResponse(validJson));

    const req = createRequest({ text: '学校 がっこう' });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(1);
    expect(data[0].word).toBe('学校');
  });

  it('strips markdown code fences from AI response', async () => {
    const mockCreate = getMockCreate();
    const validJson = JSON.stringify([
      { word: '先生', reading: 'せんせい', hanviet: 'Tiên Sinh', meaning: 'Giáo viên' },
    ]);
    mockCreate.mockResolvedValueOnce(aiResponse('```json\n' + validJson + '\n```'));

    const req = createRequest({ text: '先生' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data[0].word).toBe('先生');
  });

  it('filters out invalid items from AI response', async () => {
    const mockCreate = getMockCreate();
    const mixedJson = JSON.stringify([
      { word: '学校', reading: 'がっこう', hanviet: 'Học Hiệu', meaning: 'Trường học' },
      { invalid: true }, // should be filtered out
    ]);
    mockCreate.mockResolvedValueOnce(aiResponse(mixedJson));

    const req = createRequest({ text: 'some vocab' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
  });

  it('returns empty array when AI finds no vocab', async () => {
    const mockCreate = getMockCreate();
    mockCreate.mockResolvedValueOnce(aiResponse('[]'));

    const req = createRequest({ text: 'no Japanese here' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual([]);
  });
});

describe('POST /api/ai-format — error handling', () => {
  it('returns 500 when AI response has no text block', async () => {
    const mockCreate = getMockCreate();
    mockCreate.mockResolvedValueOnce({ content: [] });

    const req = createRequest({ text: 'test' });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('returns 500 when AI response is not valid JSON', async () => {
    const mockCreate = getMockCreate();
    mockCreate.mockResolvedValueOnce(aiResponse('not json at all'));

    const req = createRequest({ text: 'test' });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it('returns 500 when AI response JSON is not an array', async () => {
    const mockCreate = getMockCreate();
    mockCreate.mockResolvedValueOnce(aiResponse('{"word":"学校"}'));

    const req = createRequest({ text: 'test' });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('returns 429 when Anthropic API returns rate limit error', async () => {
    const mockCreate = getMockCreate();
    const RateLimitError = new (Anthropic.APIError as unknown as new (status: number, msg: string) => Error)(429, 'Rate limited');
    mockCreate.mockRejectedValueOnce(RateLimitError);

    const req = createRequest({ text: 'test vocab' });
    const res = await POST(req);
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it('returns 500 when Anthropic API returns auth error', async () => {
    const mockCreate = getMockCreate();
    const AuthError = new (Anthropic.APIError as unknown as new (status: number, msg: string) => Error)(401, 'Unauthorized');
    mockCreate.mockRejectedValueOnce(AuthError);

    const req = createRequest({ text: 'test vocab' });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('returns 500 for unexpected errors', async () => {
    const mockCreate = getMockCreate();
    mockCreate.mockRejectedValueOnce(new Error('Unexpected network error'));

    const req = createRequest({ text: 'test' });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });
});
