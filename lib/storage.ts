import { Deck } from '@/types/vocabulary';

export const STORAGE_KEY = 'nhaikanji_active_learning';
export const MAX_ITEMS_PER_DECK = 500;
export const WARN_ITEMS_THRESHOLD = 450; // Cảnh báo khi gần đến giới hạn

export interface StorageData {
  decks: Deck[];
  activeDeckId: string | null;
  version: number;
}

const CURRENT_VERSION = 1;

/**
 * Lưu dữ liệu vào localStorage
 */
export function saveToStorage(data: StorageData): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: StorageData = { ...data, version: CURRENT_VERSION };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Lỗi khi lưu dữ liệu:', error);
  }
}

/**
 * Đọc dữ liệu từ localStorage
 */
export function loadFromStorage(): StorageData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StorageData;
    return parsed;
  } catch (error) {
    console.error('Lỗi khi đọc dữ liệu:', error);
    return null;
  }
}

/**
 * Xoá toàn bộ dữ liệu khỏi localStorage
 */
export function clearStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Kiểm tra xem deck có gần đầy không
 */
export function isDeckNearFull(itemCount: number): boolean {
  return itemCount >= WARN_ITEMS_THRESHOLD;
}

/**
 * Kiểm tra xem deck có đầy không
 */
export function isDeckFull(itemCount: number): boolean {
  return itemCount >= MAX_ITEMS_PER_DECK;
}
