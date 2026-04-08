import { toHiragana, bind, unbind, isHiragana as wanakanaIsHiragana } from 'wanakana';

// Re-export toHiragana for direct conversion
export { toHiragana };

/**
 * Bind wanakana to an input element for real-time romaji → hiragana conversion
 * Ví dụ: gõ "gakkou" → tự động chuyển thành "がっこう"
 */
export function bindInput(el: HTMLInputElement): void {
  bind(el, { IMEMode: true });
}

/**
 * Unbind wanakana from an input element
 */
export function unbindInput(el: HTMLInputElement): void {
  unbind(el);
}

/**
 * Convert a romaji string to hiragana (one-time conversion)
 */
export function convertToHiragana(romaji: string): string {
  return toHiragana(romaji, { IMEMode: true });
}

/**
 * Check if a string is hiragana
 */
export function isHiragana(text: string): boolean {
  return wanakanaIsHiragana(text);
}
