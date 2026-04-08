// Core data types for Nhai Kanji Active Learning module

export interface VocabularyItem {
  id: string;
  word: string;       // Kanji hoặc Kana — BẮT BUỘC
  reading: string;    // Hiragana — BẮT BUỘC
  hanviet: string;    // Âm Hán Việt — BẮT BUỘC
  meaning: string;    // Nghĩa tiếng Việt — BẮT BUỘC
}

export interface Deck {
  id: string;
  name: string;
  items: VocabularyItem[];
  createdAt: number;
  updatedAt: number;
}

export type LearningMode = 'flashcard' | 'quiz' | 'typeinput';

export type QuizType = 'reading' | 'kanji' | 'meaning';

export type TypeInputType = 'reading' | 'hanviet';

export type FlashcardDirection = 'jp-vi' | 'vi-jp';

// JSON input format chuẩn
// [{ "word": "学校", "reading": "がっこう", "hanviet": "Học Hiệu", "meaning": "Trường học" }]
export type RawVocabInput = Omit<VocabularyItem, 'id'>;
