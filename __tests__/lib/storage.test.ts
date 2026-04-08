import {
  isDeckFull,
  isDeckNearFull,
  MAX_ITEMS_PER_DECK,
  WARN_ITEMS_THRESHOLD,
  saveToStorage,
  loadFromStorage,
  clearStorage,
  STORAGE_KEY,
} from '@/lib/storage';

describe('storage constants', () => {
  it('MAX_ITEMS_PER_DECK is 500', () => {
    expect(MAX_ITEMS_PER_DECK).toBe(500);
  });

  it('WARN_ITEMS_THRESHOLD is 450', () => {
    expect(WARN_ITEMS_THRESHOLD).toBe(450);
  });
});

describe('isDeckFull', () => {
  it('returns false when count is 0', () => {
    expect(isDeckFull(0)).toBe(false);
  });

  it('returns false when count is one below threshold', () => {
    expect(isDeckFull(499)).toBe(false);
  });

  it('returns true at MAX_ITEMS_PER_DECK (500)', () => {
    expect(isDeckFull(500)).toBe(true);
  });

  it('returns true when count exceeds MAX_ITEMS_PER_DECK', () => {
    expect(isDeckFull(600)).toBe(true);
  });
});

describe('isDeckNearFull', () => {
  it('returns false when count is below WARN_ITEMS_THRESHOLD', () => {
    expect(isDeckNearFull(0)).toBe(false);
    expect(isDeckNearFull(449)).toBe(false);
  });

  it('returns true at WARN_ITEMS_THRESHOLD (450)', () => {
    expect(isDeckNearFull(450)).toBe(true);
  });

  it('returns true above warning threshold', () => {
    expect(isDeckNearFull(499)).toBe(true);
    expect(isDeckNearFull(500)).toBe(true);
  });
});

describe('saveToStorage / loadFromStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and loads data correctly', () => {
    const data = {
      decks: [],
      activeDeckId: null,
      version: 1,
    };
    saveToStorage(data);
    const loaded = loadFromStorage();
    expect(loaded).not.toBeNull();
    expect(loaded?.decks).toEqual([]);
    expect(loaded?.activeDeckId).toBeNull();
  });

  it('returns null when nothing is stored', () => {
    expect(loadFromStorage()).toBeNull();
  });

  it('always writes the current version number', () => {
    saveToStorage({ decks: [], activeDeckId: null, version: 0 });
    const loaded = loadFromStorage();
    expect(loaded?.version).toBe(1);
  });
});

describe('clearStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('removes the storage key', () => {
    saveToStorage({ decks: [], activeDeckId: null, version: 1 });
    clearStorage();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('is a no-op when storage is already empty', () => {
    expect(() => clearStorage()).not.toThrow();
  });
});
