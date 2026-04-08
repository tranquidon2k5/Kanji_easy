import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Deck, VocabularyItem, LearningMode } from '@/types/vocabulary';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface ActiveLearningStore {
  // State
  decks: Deck[];
  activeDeckId: string | null;
  activeMode: LearningMode | null;

  // Computed helpers (not persisted, derived)
  getActiveDeck: () => Deck | undefined;

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
  persist(
    (set, get) => ({
      decks: [],
      activeDeckId: null,
      activeMode: null,
      lastImportedIds: [],

      getActiveDeck: () => {
        const { decks, activeDeckId } = get();
        return decks.find((d) => d.id === activeDeckId);
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
        return id;
      },

      renameDeck: (id: string, name: string) => {
        set((state) => ({
          decks: state.decks.map((d) =>
            d.id === id
              ? { ...d, name: name.trim() || d.name, updatedAt: Date.now() }
              : d
          ),
        }));
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
      },

      setActiveDeck: (id: string) => {
        set({ activeDeckId: id, activeMode: null });
      },

      addItems: (items: Array<Omit<VocabularyItem, 'id'>>) => {
        const { activeDeckId } = get();
        if (!activeDeckId) return 0;

        const now = Date.now();
        const newIds: string[] = [];

        const newItems: VocabularyItem[] = items.map((item) => {
          const id = generateId();
          newIds.push(id);
          return { ...item, id };
        });

        set((state) => ({
          decks: state.decks.map((d) =>
            d.id === activeDeckId
              ? {
                  ...d,
                  items: [...d.items, ...newItems],
                  updatedAt: now,
                }
              : d
          ),
          lastImportedIds: newIds,
        }));

        return newItems.length;
      },

      updateItem: (deckId: string, item: VocabularyItem) => {
        set((state) => ({
          decks: state.decks.map((d) =>
            d.id === deckId
              ? {
                  ...d,
                  items: d.items.map((i) => (i.id === item.id ? item : i)),
                  updatedAt: Date.now(),
                }
              : d
          ),
        }));
      },

      deleteItem: (deckId: string, itemId: string) => {
        set((state) => ({
          decks: state.decks.map((d) =>
            d.id === deckId
              ? {
                  ...d,
                  items: d.items.filter((i) => i.id !== itemId),
                  updatedAt: Date.now(),
                }
              : d
          ),
        }));
      },

      clearItems: (deckId: string) => {
        set((state) => ({
          decks: state.decks.map((d) =>
            d.id === deckId
              ? { ...d, items: [], updatedAt: Date.now() }
              : d
          ),
          lastImportedIds: [],
        }));
      },

      setActiveMode: (mode: LearningMode | null) => {
        set({ activeMode: mode });
      },

      undoLastImport: (deckId: string) => {
        const { lastImportedIds } = get();
        if (lastImportedIds.length === 0) return;

        const idsToRemove = new Set(lastImportedIds);
        set((state) => ({
          decks: state.decks.map((d) =>
            d.id === deckId
              ? {
                  ...d,
                  items: d.items.filter((i) => !idsToRemove.has(i.id)),
                  updatedAt: Date.now(),
                }
              : d
          ),
          lastImportedIds: [],
        }));
      },
    }),
    {
      name: 'nhaikanji_active_learning',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        decks: state.decks,
        activeDeckId: state.activeDeckId,
        // activeMode is NOT persisted — reset on page reload
      }),
    }
  )
);
