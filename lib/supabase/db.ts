import { Deck, VocabularyItem } from '@/types/vocabulary';
import { createClient } from './client';

// ──────────────────────────────────────────────
// Decks
// ──────────────────────────────────────────────

export async function fetchDecks(userId: string): Promise<Deck[]> {
  const supabase = createClient();

  const { data: decksData, error: decksError } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (decksError) throw decksError;
  if (!decksData || decksData.length === 0) return [];

  const deckIds = decksData.map((d) => d.id);

  const { data: itemsData, error: itemsError } = await supabase
    .from('vocabulary_items')
    .select('*')
    .in('deck_id', deckIds)
    .order('sort_order', { ascending: true });

  if (itemsError) throw itemsError;

  const itemsByDeck = new Map<string, VocabularyItem[]>();
  for (const item of itemsData ?? []) {
    if (!itemsByDeck.has(item.deck_id)) itemsByDeck.set(item.deck_id, []);
    itemsByDeck.get(item.deck_id)!.push({
      id: item.id,
      word: item.word,
      reading: item.reading,
      hanviet: item.hanviet,
      meaning: item.meaning,
    });
  }

  return decksData.map((d) => ({
    id: d.id,
    name: d.name,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    items: itemsByDeck.get(d.id) ?? [],
  }));
}

export async function createDeck(deck: Deck, userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('decks').insert({
    id: deck.id,
    user_id: userId,
    name: deck.name,
    created_at: deck.createdAt,
    updated_at: deck.updatedAt,
  });
  if (error) throw error;
}

export async function renameDeck(
  id: string,
  name: string,
  updatedAt: number
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('decks')
    .update({ name, updated_at: updatedAt })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteDeck(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('decks').delete().eq('id', id);
  if (error) throw error;
}

// ──────────────────────────────────────────────
// Vocabulary items
// ──────────────────────────────────────────────

export async function upsertVocabItems(
  items: VocabularyItem[],
  deckId: string,
  userId: string,
  startingSortOrder: number = 0
): Promise<void> {
  if (items.length === 0) return;
  const supabase = createClient();
  const rows = items.map((item, i) => ({
    id: item.id,
    deck_id: deckId,
    user_id: userId,
    word: item.word,
    reading: item.reading,
    hanviet: item.hanviet,
    meaning: item.meaning,
    sort_order: startingSortOrder + i,
  }));
  const { error } = await supabase
    .from('vocabulary_items')
    .upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteVocabItem(itemId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('vocabulary_items')
    .delete()
    .eq('id', itemId);
  if (error) throw error;
}

export async function clearVocabItems(deckId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('vocabulary_items')
    .delete()
    .eq('deck_id', deckId);
  if (error) throw error;
}

export async function deleteVocabItemsByIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const supabase = createClient();
  const { error } = await supabase
    .from('vocabulary_items')
    .delete()
    .in('id', ids);
  if (error) throw error;
}

export async function updateDeckTimestamp(
  deckId: string,
  updatedAt: number
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('decks')
    .update({ updated_at: updatedAt })
    .eq('id', deckId);
  if (error) throw error;
}
