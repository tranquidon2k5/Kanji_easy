import { create } from 'zustand';
import { Deck, VocabularyItem, LearningMode } from '@/types/vocabulary';
import * as db from '@/lib/supabase/db';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface ActiveLearningStore {
  // State
  decks: Deck[];
  activeDeckId: string | null;
  activeMode: LearningMode | null;
  userId: string | null;

  // Computed helpers (not persisted, derived)
  getActiveDeck: () => Deck | undefined;

  // Bootstrap actions
  loadDecks: (userId: string) => Promise<void>;
  resetStore: () => void;

  // Deck actions
  createDeck: (name: string) => string; // returns new deck id
  renameDeck: (id: string, name: string) => void;
  deleteDeck: (id: string) => void;
  setActiveDeck: (id: string) => void;

  // Vocabulary actions
  addItems: (items: Array<Omit<VocabularyItem, 'id'>>) => number; // returns count added
  updateItem: (deckId: string, item: VocabularyItem) => void;
  deleteItem: (deckId: string, itemId: string) => void;
  clearItems: (deckId: string) => void;

  // Mode actions
  setActiveMode: (mode: LearningMode | null) => void;

  // Undo last import
  lastImportedIds: string[];
  undoLastImport: (deckId: string) => void;
}

export const useActiveLearningStore = create<ActiveLearningStore>()(
  (set, get) => ({
    decks: [],
    activeDeckId: null,
    activeMode: null,
    lastImportedIds: [],
    userId: null,

    getActiveDeck: () => {
      const { decks, activeDeckId } = get();
      return decks.find((d) => d.id === activeDeckId);
    },

    loadDecks: async (userId: string) => {
      const decks = await db.fetchDecks(userId);
      set({
        decks,
        userId,
        activeDeckId: decks[0]?.id ?? null,
      });
    },

    resetStore: () => {
      set({
        decks: [],
        activeDeckId: null,
        activeMode: null,
        lastImportedIds: [],
        userId: null,
      });
    },

    createDeck: (name: string) => {
      const id = generateId();
      const now = Date.now();
      const newDeck: Deck = {
        id,
        name: name.trim() || 'Bài mới',
        items: [],
        createdAt: now,
        updatedAt: now,
      };
      set((state) => ({
        decks: [...state.decks, newDeck],
        activeDeckId: id,
      }));
      const { userId } = get();
      if (userId) db.createDeck(newDeck, userId).catch(console.error);
      return id;
    },

    renameDeck: (id: string, name: string) => {
      const now = Date.now();
      set((state) => ({
        decks: state.decks.map((d) =>
          d.id === id
            ? { ...d, name: name.trim() || d.name, updatedAt: now }
            : d
        ),
      }));
      db.renameDeck(id, name.trim(), now).catch(console.error);
    },

    deleteDeck: (id: string) => {
      set((state) => {
        const remaining = state.decks.filter((d) => d.id !== id);
        const newActiveDeckId =
          state.activeDeckId === id
            ? (remaining[remaining.length - 1]?.id ?? null)
            : state.activeDeckId;
        return {
          decks: remaining,
          activeDeckId: newActiveDeckId,
          activeMode: state.activeDeckId === id ? null : state.activeMode,
        };
      });
      db.deleteDeck(id).catch(console.error);
    },

    setActiveDeck: (id: string) => {
      set({ activeDeckId: id, activeMode: null });
    },

    addItems: (items: Array<Omit<VocabularyItem, 'id'>>) => {
      const { activeDeckId, userId } = get();
      if (!activeDeckId) return 0;

      const now = Date.now();
      const newIds: string[] = [];

      const newItems: VocabularyItem[] = items.map((item) => {
        const id = generateId();
        newIds.push(id);
        return { ...item, id };
      });

      let existingCount = 0;
      set((state) => {
        const deck = state.decks.find((d) => d.id === activeDeckId);
        existingCount = deck?.items.length ?? 0;
        return {
          decks: state.decks.map((d) =>
            d.id === activeDeckId
              ? { ...d, items: [...d.items, ...newItems], updatedAt: now }
              : d
          ),
          lastImportedIds: newIds,
        };
      });

      if (userId) {
        db.upsertVocabItems(newItems, activeDeckId, userId, existingCount).catch(
          console.error
        );
        db.updateDeckTimestamp(activeDeckId, now).catch(console.error);
      }

      return newItems.length;
    },

    updateItem: (deckId: string, item: VocabularyItem) => {
      const now = Date.now();
      let sortOrder = 0;
      set((state) => {
        const deck = state.decks.find((d) => d.id === deckId);
        sortOrder = deck?.items.findIndex((i) => i.id === item.id) ?? 0;
        return {
          decks: state.decks.map((d) =>
            d.id === deckId
              ? {
                  ...d,
                  items: d.items.map((i) => (i.id === item.id ? item : i)),
                  updatedAt: now,
                }
              : d
          ),
        };
      });
      const { userId } = get();
      if (userId) {
        db.upsertVocabItems([item], deckId, userId, sortOrder).catch(
          console.error
        );
      }
    },

    deleteItem: (deckId: string, itemId: string) => {
      const now = Date.now();
      set((state) => ({
        decks: state.decks.map((d) =>
          d.id === deckId
            ? {
                ...d,
                items: d.items.filter((i) => i.id !== itemId),
                updatedAt: now,
              }
            : d
        ),
      }));
      db.deleteVocabItem(itemId).catch(console.error);
    },

    clearItems: (deckId: string) => {
      const now = Date.now();
      set((state) => ({
        decks: state.decks.map((d) =>
          d.id === deckId ? { ...d, items: [], updatedAt: now } : d
        ),
        lastImportedIds: [],
      }));
      db.clearVocabItems(deckId).catch(console.error);
    },

    setActiveMode: (mode: LearningMode | null) => {
      set({ activeMode: mode });
    },

    undoLastImport: (deckId: string) => {
      const { lastImportedIds } = get();
      if (lastImportedIds.length === 0) return;

      const idsToRemove = new Set(lastImportedIds);
      const now = Date.now();
      set((state) => ({
        decks: state.decks.map((d) =>
          d.id === deckId
            ? {
                ...d,
                items: d.items.filter((i) => !idsToRemove.has(i.id)),
                updatedAt: now,
              }
            : d
        ),
        lastImportedIds: [],
      }));
      db.deleteVocabItemsByIds(lastImportedIds).catch(console.error);
    },
  })
);
