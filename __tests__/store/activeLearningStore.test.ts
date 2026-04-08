import { act, renderHook } from '@testing-library/react';
import { useActiveLearningStore } from '@/store/activeLearningStore';

// Reset Zustand store state before each test to ensure isolation.
// We patch all persisted + non-persisted slices back to initial values.
beforeEach(() => {
  useActiveLearningStore.setState({
    decks: [],
    activeDeckId: null,
    activeMode: null,
    lastImportedIds: [],
  });
  localStorage.clear();
});

const sampleItems = [
  { word: '学校', reading: 'がっこう', hanviet: 'Học Hiệu', meaning: 'Trường học' },
  { word: '先生', reading: 'せんせい', hanviet: 'Tiên Sinh', meaning: 'Giáo viên' },
];

// ---------------------------------------------------------------------------
// Deck Management
// ---------------------------------------------------------------------------
describe('createDeck', () => {
  it('adds a deck to the store', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck('Bài 1'); });
    expect(result.current.decks).toHaveLength(1);
    expect(result.current.decks[0].name).toBe('Bài 1');
  });

  it('sets the new deck as the active deck', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck('Bài 1'); });
    expect(result.current.activeDeckId).toBe(result.current.decks[0].id);
  });

  it('returns the new deck id', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    let id!: string;
    act(() => { id = result.current.createDeck('Bài 1'); });
    expect(id).toBe(result.current.decks[0].id);
  });

  it('trims whitespace from name', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck('  Bài 1  '); });
    expect(result.current.decks[0].name).toBe('Bài 1');
  });

  it('uses default name "Bài mới" when name is empty', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck(''); });
    expect(result.current.decks[0].name).toBe('Bài mới');
  });

  it('initializes the deck with an empty items array', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck('Bài 1'); });
    expect(result.current.decks[0].items).toEqual([]);
  });

  it('records createdAt and updatedAt timestamps', () => {
    const before = Date.now();
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck('Bài 1'); });
    const after = Date.now();
    const deck = result.current.decks[0];
    expect(deck.createdAt).toBeGreaterThanOrEqual(before);
    expect(deck.createdAt).toBeLessThanOrEqual(after);
    expect(deck.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it('can create multiple decks and keeps all of them', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck('A'); });
    act(() => { result.current.createDeck('B'); });
    expect(result.current.decks).toHaveLength(2);
  });

  it('sets the most recently created deck as active', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    let idA!: string;
    let idB!: string;
    act(() => { idA = result.current.createDeck('A'); });
    act(() => { idB = result.current.createDeck('B'); });
    expect(result.current.activeDeckId).toBe(idB);
    expect(idA).not.toBe(idB);
  });
});

describe('renameDeck', () => {
  it('updates the deck name', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    let id!: string;
    act(() => { id = result.current.createDeck('Old Name'); });
    act(() => { result.current.renameDeck(id, 'New Name'); });
    expect(result.current.decks[0].name).toBe('New Name');
  });

  it('trims whitespace from new name', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    let id!: string;
    act(() => { id = result.current.createDeck('Old'); });
    act(() => { result.current.renameDeck(id, '  Trimmed  '); });
    expect(result.current.decks[0].name).toBe('Trimmed');
  });

  it('keeps old name when new name is empty', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    let id!: string;
    act(() => { id = result.current.createDeck('Original'); });
    act(() => { result.current.renameDeck(id, ''); });
    expect(result.current.decks[0].name).toBe('Original');
  });

  it('does not affect other decks', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    let idA!: string;
    act(() => { idA = result.current.createDeck('A'); });
    act(() => { result.current.createDeck('B'); });
    act(() => { result.current.renameDeck(idA, 'Renamed A'); });
    const deckB = result.current.decks.find((d) => d.name === 'B');
    expect(deckB).toBeDefined();
  });
});

describe('deleteDeck', () => {
  it('removes the deck from the list', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    let id!: string;
    act(() => { id = result.current.createDeck('Test'); });
    act(() => { result.current.deleteDeck(id); });
    expect(result.current.decks).toHaveLength(0);
  });

  it('sets activeDeckId to null when last deck is deleted', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    let id!: string;
    act(() => { id = result.current.createDeck('Test'); });
    act(() => { result.current.deleteDeck(id); });
    expect(result.current.activeDeckId).toBeNull();
  });

  it('switches activeDeckId to a remaining deck when active deck is deleted', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    let idA!: string;
    let idB!: string;
    act(() => { idA = result.current.createDeck('A'); });
    act(() => { idB = result.current.createDeck('B'); });
    // B is now active; delete B
    act(() => { result.current.deleteDeck(idB); });
    expect(result.current.activeDeckId).toBe(idA);
  });

  it('does not change activeDeckId when a non-active deck is deleted', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    let idA!: string;
    let idB!: string;
    act(() => { idA = result.current.createDeck('A'); });
    act(() => { idB = result.current.createDeck('B'); });
    // B is now active; delete A
    act(() => { result.current.deleteDeck(idA); });
    expect(result.current.activeDeckId).toBe(idB);
  });

  it('clears activeMode when the active deck is deleted', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    let id!: string;
    act(() => { id = result.current.createDeck('Test'); });
    act(() => { result.current.setActiveMode('flashcard'); });
    act(() => { result.current.deleteDeck(id); });
    expect(result.current.activeMode).toBeNull();
  });
});

describe('setActiveDeck', () => {
  it('changes activeDeckId', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    let idA!: string;
    let idB!: string;
    act(() => { idA = result.current.createDeck('A'); });
    act(() => { idB = result.current.createDeck('B'); });
    act(() => { result.current.setActiveDeck(idA); });
    expect(result.current.activeDeckId).toBe(idA);
  });

  it('resets activeMode when switching decks', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    let idA!: string;
    let idB!: string;
    act(() => { idA = result.current.createDeck('A'); });
    act(() => { idB = result.current.createDeck('B'); });
    act(() => { result.current.setActiveMode('quiz'); });
    act(() => { result.current.setActiveDeck(idA); });
    expect(result.current.activeMode).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Vocabulary Management
// ---------------------------------------------------------------------------
describe('addItems', () => {
  it('adds items to the active deck', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck('Test'); });
    act(() => { result.current.addItems(sampleItems); });
    expect(result.current.getActiveDeck()?.items).toHaveLength(2);
  });

  it('returns the count of added items', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck('Test'); });
    let count!: number;
    act(() => { count = result.current.addItems(sampleItems); });
    expect(count).toBe(2);
  });

  it('assigns a unique id to each item', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck('Test'); });
    act(() => { result.current.addItems(sampleItems); });
    const ids = result.current.getActiveDeck()!.items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('preserves word, reading, hanviet, meaning fields', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck('Test'); });
    act(() => { result.current.addItems([sampleItems[0]]); });
    const item = result.current.getActiveDeck()!.items[0];
    expect(item.word).toBe('学校');
    expect(item.reading).toBe('がっこう');
    expect(item.hanviet).toBe('Học Hiệu');
    expect(item.meaning).toBe('Trường học');
  });

  it('appends to existing items', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck('Test'); });
    act(() => { result.current.addItems([sampleItems[0]]); });
    act(() => { result.current.addItems([sampleItems[1]]); });
    expect(result.current.getActiveDeck()?.items).toHaveLength(2);
  });

  it('returns 0 when no active deck is set', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    let count!: number;
    act(() => { count = result.current.addItems(sampleItems); });
    expect(count).toBe(0);
  });

  it('records lastImportedIds for undo', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck('Test'); });
    act(() => { result.current.addItems(sampleItems); });
    expect(result.current.lastImportedIds).toHaveLength(2);
  });
});

describe('updateItem', () => {
  it('updates fields on the specified item', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck('Test'); });
    act(() => { result.current.addItems([sampleItems[0]]); });
    const deckId = result.current.activeDeckId!;
    const item = result.current.getActiveDeck()!.items[0];
    const updated = { ...item, meaning: 'Trường học (cập nhật)' };
    act(() => { result.current.updateItem(deckId, updated); });
    expect(result.current.getActiveDeck()!.items[0].meaning).toBe('Trường học (cập nhật)');
  });

  it('does not affect other items', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck('Test'); });
    act(() => { result.current.addItems(sampleItems); });
    const deckId = result.current.activeDeckId!;
    const [first] = result.current.getActiveDeck()!.items;
    act(() => { result.current.updateItem(deckId, { ...first, meaning: 'Changed' }); });
    const second = result.current.getActiveDeck()!.items[1];
    expect(second.meaning).toBe('Giáo viên');
  });
});

describe('deleteItem', () => {
  it('removes the specified item', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck('Test'); });
    act(() => { result.current.addItems(sampleItems); });
    const deckId = result.current.activeDeckId!;
    const itemId = result.current.getActiveDeck()!.items[0].id;
    act(() => { result.current.deleteItem(deckId, itemId); });
    expect(result.current.getActiveDeck()?.items).toHaveLength(1);
  });

  it('keeps items that were not deleted', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck('Test'); });
    act(() => { result.current.addItems(sampleItems); });
    const deckId = result.current.activeDeckId!;
    const [first, second] = result.current.getActiveDeck()!.items;
    act(() => { result.current.deleteItem(deckId, first.id); });
    expect(result.current.getActiveDeck()!.items[0].id).toBe(second.id);
  });
});

describe('clearItems', () => {
  it('removes all items from the specified deck', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck('Test'); });
    act(() => { result.current.addItems(sampleItems); });
    const deckId = result.current.activeDeckId!;
    act(() => { result.current.clearItems(deckId); });
    expect(result.current.getActiveDeck()?.items).toHaveLength(0);
  });

  it('clears lastImportedIds', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck('Test'); });
    act(() => { result.current.addItems(sampleItems); });
    const deckId = result.current.activeDeckId!;
    act(() => { result.current.clearItems(deckId); });
    expect(result.current.lastImportedIds).toHaveLength(0);
  });

  it('does not affect other decks', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    let idA!: string;
    act(() => { idA = result.current.createDeck('A'); });
    act(() => { result.current.addItems([sampleItems[0]]); });
    act(() => { result.current.createDeck('B'); });
    act(() => { result.current.addItems([sampleItems[1]]); });
    act(() => { result.current.clearItems(result.current.activeDeckId!); }); // clear B
    const deckA = result.current.decks.find((d) => d.id === idA);
    expect(deckA?.items).toHaveLength(1);
  });
});

describe('undoLastImport', () => {
  it('removes the items added in the last import', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck('Test'); });
    act(() => { result.current.addItems(sampleItems); });
    const deckId = result.current.activeDeckId!;
    act(() => { result.current.undoLastImport(deckId); });
    expect(result.current.getActiveDeck()?.items).toHaveLength(0);
  });

  it('clears lastImportedIds after undo', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck('Test'); });
    act(() => { result.current.addItems(sampleItems); });
    const deckId = result.current.activeDeckId!;
    act(() => { result.current.undoLastImport(deckId); });
    expect(result.current.lastImportedIds).toHaveLength(0);
  });

  it('only removes items from the last import, not earlier ones', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck('Test'); });
    act(() => { result.current.addItems([sampleItems[0]]); }); // first import
    act(() => { result.current.addItems([sampleItems[1]]); }); // second import
    const deckId = result.current.activeDeckId!;
    act(() => { result.current.undoLastImport(deckId); }); // undo second import only
    expect(result.current.getActiveDeck()?.items).toHaveLength(1);
    expect(result.current.getActiveDeck()?.items[0].word).toBe('学校');
  });

  it('is a no-op when lastImportedIds is empty', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck('Test'); });
    act(() => { result.current.addItems(sampleItems); });
    const deckId = result.current.activeDeckId!;
    act(() => { result.current.undoLastImport(deckId); }); // first undo
    act(() => { result.current.undoLastImport(deckId); }); // second undo — no-op
    expect(result.current.getActiveDeck()?.items).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Mode Management
// ---------------------------------------------------------------------------
describe('setActiveMode', () => {
  it('sets mode to "flashcard"', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.setActiveMode('flashcard'); });
    expect(result.current.activeMode).toBe('flashcard');
  });

  it('sets mode to "quiz"', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.setActiveMode('quiz'); });
    expect(result.current.activeMode).toBe('quiz');
  });

  it('sets mode to "typeinput"', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.setActiveMode('typeinput'); });
    expect(result.current.activeMode).toBe('typeinput');
  });

  it('clears mode by setting null', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.setActiveMode('flashcard'); });
    act(() => { result.current.setActiveMode(null); });
    expect(result.current.activeMode).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getActiveDeck (derived helper)
// ---------------------------------------------------------------------------
describe('getActiveDeck', () => {
  it('returns undefined when no decks exist', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    expect(result.current.getActiveDeck()).toBeUndefined();
  });

  it('returns the active deck after creation', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck('Test'); });
    const deck = result.current.getActiveDeck();
    expect(deck).toBeDefined();
    expect(deck?.name).toBe('Test');
  });

  it('reflects changes after addItems', () => {
    const { result } = renderHook(() => useActiveLearningStore());
    act(() => { result.current.createDeck('Test'); });
    act(() => { result.current.addItems(sampleItems); });
    expect(result.current.getActiveDeck()?.items).toHaveLength(2);
  });
});
