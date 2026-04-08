import {
  convertToHiragana,
  isHiragana,
  toHiragana,
} from '@/lib/romajiToHiragana';

describe('convertToHiragana', () => {
  it('converts basic romaji to hiragana', () => {
    expect(convertToHiragana('a')).toBe('あ');
    expect(convertToHiragana('i')).toBe('い');
    expect(convertToHiragana('u')).toBe('う');
    expect(convertToHiragana('e')).toBe('え');
    expect(convertToHiragana('o')).toBe('お');
  });

  it('converts ga to が', () => {
    expect(convertToHiragana('ga')).toBe('が');
  });

  it('converts ki to き', () => {
    expect(convertToHiragana('ki')).toBe('き');
  });

  it('returns empty string for empty input', () => {
    expect(convertToHiragana('')).toBe('');
  });

  it('passes through already-hiragana text unchanged', () => {
    expect(convertToHiragana('がっこう')).toBe('がっこう');
  });
});

describe('isHiragana', () => {
  it('returns true for pure hiragana strings', () => {
    expect(isHiragana('がっこう')).toBe(true);
    expect(isHiragana('せんせい')).toBe(true);
  });

  it('returns false for romaji strings', () => {
    expect(isHiragana('gakkou')).toBe(false);
  });

  it('returns false for kanji', () => {
    expect(isHiragana('学校')).toBe(false);
  });

  it('returns false for mixed strings', () => {
    expect(isHiragana('がgakkou')).toBe(false);
  });
});

describe('toHiragana (re-export)', () => {
  it('is re-exported from wanakana', () => {
    expect(typeof toHiragana).toBe('function');
  });

  it('converts romaji to hiragana', () => {
    expect(toHiragana('sakura')).toBe('さくら');
  });
});
