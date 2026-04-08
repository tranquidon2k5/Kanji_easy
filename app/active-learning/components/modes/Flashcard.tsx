'use client';

import { useState, useCallback, useMemo } from 'react';
import { VocabularyItem, FlashcardDirection } from '@/types/vocabulary';
import TTSButton from '../shared/TTSButton';
import ProgressBar from '../shared/ProgressBar';
import { useKeyboardShortcuts } from '../shared/KeyboardShortcuts';

interface FlashcardProps {
  items: VocabularyItem[];
  onExit: () => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Flashcard({ items, onExit }: FlashcardProps) {
  const [shuffledItems, setShuffledItems] = useState<VocabularyItem[]>([...items]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState<FlashcardDirection>('jp-vi');
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());
  const [unknownIds, setUnknownIds] = useState<Set<string>>(new Set());

  const currentItem = shuffledItems[currentIndex];
  const total = shuffledItems.length;

  const goNext = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % total);
    }, 200);
  }, [total]);

  const goPrev = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((i) => (i - 1 + total) % total);
    }, 200);
  }, [total]);

  const handleFlip = useCallback(() => {
    setIsFlipped((f) => !f);
  }, []);

  const markKnown = useCallback(() => {
    if (!currentItem) return;
    setKnownIds((s) => new Set([...s, currentItem.id]));
    setUnknownIds((s) => { const n = new Set(s); n.delete(currentItem.id); return n; });
    goNext();
  }, [currentItem, goNext]);

  const markUnknown = useCallback(() => {
    if (!currentItem) return;
    setUnknownIds((s) => new Set([...s, currentItem.id]));
    setKnownIds((s) => { const n = new Set(s); n.delete(currentItem.id); return n; });
    goNext();
  }, [currentItem, goNext]);

  const handleReset = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownIds(new Set());
    setUnknownIds(new Set());
  }, []);

  const handleShuffle = useCallback(() => {
    setShuffledItems(shuffleArray(items));
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [items]);

  const toggleDirection = useCallback(() => {
    setDirection((d) => (d === 'jp-vi' ? 'vi-jp' : 'jp-vi'));
    setIsFlipped(false);
  }, []);

  // Front content depends on direction
  const frontContent = useMemo(() => {
    if (!currentItem) return null;
    if (direction === 'jp-vi') {
      return (
        <div className="flex flex-col items-center justify-center gap-4">
          <span className="text-7xl font-bold text-white tracking-wide select-none">
            {currentItem.word}
          </span>
          <TTSButton text={currentItem.word} size="lg" className="text-slate-400 hover:text-blue-400" />
          <p className="text-slate-500 text-sm mt-2">Nhấn Space hoặc nhấn vào thẻ để lật</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center gap-3">
        <span className="text-3xl font-bold text-white">{currentItem.meaning}</span>
        <span className="text-slate-400 text-sm">{currentItem.hanviet}</span>
        <p className="text-slate-500 text-sm mt-2">Nhấn Space hoặc nhấn vào thẻ để lật</p>
      </div>
    );
  }, [currentItem, direction]);

  // Back content
  const backContent = useMemo(() => {
    if (!currentItem) return null;
    if (direction === 'jp-vi') {
      return (
        <div className="flex flex-col items-center justify-center gap-3">
          <span className="text-2xl text-blue-400">{currentItem.reading}</span>
          <span className="text-green-400 uppercase font-bold tracking-widest text-sm">
            {currentItem.hanviet}
          </span>
          <span className="text-white font-bold text-2xl text-center">{currentItem.meaning}</span>
          <TTSButton text={currentItem.word} size="lg" className="mt-1" />
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center gap-3">
        <span className="text-7xl font-bold text-white tracking-wide">{currentItem.word}</span>
        <span className="text-2xl text-blue-400">{currentItem.reading}</span>
        <TTSButton text={currentItem.word} size="lg" className="mt-1" />
      </div>
    );
  }, [currentItem, direction]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { keys: ['Space'], handler: handleFlip, ignoreWhenTyping: true },
    { keys: ['KeyZ'], handler: markKnown, ignoreWhenTyping: true },
    { keys: ['KeyX'], handler: markUnknown, ignoreWhenTyping: true },
    { keys: ['ArrowLeft'], handler: goPrev, ignoreWhenTyping: true },
    { keys: ['ArrowRight'], handler: goNext, ignoreWhenTyping: true },
  ]);

  if (!currentItem) return null;

  const isKnown = knownIds.has(currentItem.id);
  const isUnknown = unknownIds.has(currentItem.id);

  return (
    <div className="fixed inset-0 bg-[#0f1120] flex flex-col z-50">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button
          onClick={onExit}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </button>

        <div className="flex items-center gap-3">
          {/* Known/Unknown counts */}
          <span className="text-xs text-green-400">{knownIds.size} biết</span>
          <span className="text-slate-600">|</span>
          <span className="text-xs text-red-400">{unknownIds.size} chưa biết</span>
        </div>

        <button className="text-slate-400 hover:text-yellow-400 transition-colors" title="Yêu thích">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      </div>

      {/* Card area */}
      <div className="flex-1 flex items-center justify-center px-4 py-2">
        <div className="w-full max-w-xl">
          {/* Keyboard hint */}
          <p className="text-center text-xs text-slate-600 mb-3 hidden md:block">
            Phím tắt: <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Space</kbd> lật &nbsp;
            <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Z</kbd> biết &nbsp;
            <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">X</kbd> chưa biết &nbsp;
            <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">R</kbd> nghe &nbsp;
            <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">←</kbd>
            <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">→</kbd> điều hướng
          </p>

          {/* Flashcard */}
          <div
            className="flashcard-container cursor-pointer select-none"
            style={{ height: '300px' }}
            onClick={handleFlip}
          >
            <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`}>
              {/* Front */}
              <div className={`flashcard-front w-full h-full rounded-2xl flex items-center justify-center
                ${isKnown ? 'bg-[#1a2e1a] border border-green-700' : isUnknown ? 'bg-[#2e1a1a] border border-red-800' : 'bg-[#1e2235] border border-slate-700'}`}>
                {frontContent}
              </div>

              {/* Back */}
              <div className="flashcard-back w-full h-full bg-[#1a2040] border border-blue-800 rounded-2xl flex items-center justify-center">
                {backContent}
              </div>
            </div>
          </div>

          {/* Navigation arrows */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={goPrev}
              className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <span className="text-slate-400 text-sm tabular-nums">{currentIndex + 1} / {total}</span>

            <button
              onClick={goNext}
              className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="bg-[#161829] border-t border-slate-800 px-4 py-3 shrink-0">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          {/* Unknown (X) */}
          <button
            onClick={markUnknown}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${isUnknown
                ? 'bg-red-600 text-white'
                : 'bg-red-950 border border-red-800 text-red-400 hover:bg-red-900'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="hidden sm:inline">Chưa biết</span>
          </button>

          {/* Center controls */}
          <div className="flex items-center gap-2">
            {/* Direction toggle */}
            <button
              onClick={toggleDirection}
              className="text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors"
              title="Đổi chiều"
            >
              {direction === 'jp-vi' ? 'JP→VI' : 'VI→JP'}
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              title="Bắt đầu lại"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Shuffle */}
            <button
              onClick={handleShuffle}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              title="Xáo thẻ"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          {/* Progress */}
          <div className="hidden sm:block w-32">
            <ProgressBar current={currentIndex + 1} total={total} colorClass="bg-blue-500" />
          </div>

          {/* Known (Z) */}
          <button
            onClick={markKnown}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${isKnown
                ? 'bg-green-600 text-white'
                : 'bg-green-950 border border-green-800 text-green-400 hover:bg-green-900'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="hidden sm:inline">Biết rồi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
