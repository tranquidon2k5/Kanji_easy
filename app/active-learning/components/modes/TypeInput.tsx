'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { VocabularyItem, TypeInputType } from '@/types/vocabulary';
import TTSButton from '../shared/TTSButton';
import ProgressBar from '../shared/ProgressBar';
import { useKeyboardShortcuts } from '../shared/KeyboardShortcuts';
import { bindInput, unbindInput } from '@/lib/romajiToHiragana';

interface TypeInputProps {
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

function normalize(str: string): string {
  return str.trim().toLowerCase();
}

export default function TypeInput({ items, onExit }: TypeInputProps) {
  const [inputType, setInputType] = useState<TypeInputType>('reading');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledItems] = useState(() => shuffleArray(items));
  const [userInput, setUserInput] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [revealedChars, setRevealedChars] = useState<Set<number>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const total = shuffledItems.length;
  const currentItem = shuffledItems[currentIndex];

  const correctAnswer = useMemo(
    () => (inputType === 'reading' ? currentItem?.reading ?? '' : currentItem?.hanviet ?? ''),
    [currentItem, inputType]
  );

  const MAX_HINTS = 4;

  // Bind/unbind wanakana
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    if (inputType === 'reading') {
      bindInput(el);
      return () => unbindInput(el);
    }
  }, [inputType, currentIndex]);

  // Focus input on mount/index change
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [currentIndex, inputType]);

  // Reset per question
  useEffect(() => {
    setUserInput('');
    setIsChecked(false);
    setIsCorrect(null);
    setHintsUsed(0);
    setRevealedChars(new Set());
    setShowSuccess(false);
  }, [currentIndex, inputType]);

  const handleCheck = useCallback(() => {
    if (isChecked) return;
    if (!userInput.trim()) return;

    const correct = normalize(correctAnswer);
    const given = normalize(userInput);
    const ok = given === correct;

    setIsChecked(true);
    setIsCorrect(ok);

    if (ok) {
      setShowSuccess(true);
      const t = setTimeout(() => {
        setCurrentIndex((i) => (i + 1) % total);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [isChecked, userInput, correctAnswer, total]);

  const handleNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % total);
  }, [total]);

  const handleHint = useCallback(() => {
    if (hintsUsed >= MAX_HINTS) return;
    const chars = [...correctAnswer];
    // Find next unrevealed non-space char
    for (let i = 0; i < chars.length; i++) {
      if (!revealedChars.has(i) && chars[i] !== ' ') {
        setRevealedChars((s) => new Set([...s, i]));
        setHintsUsed((h) => h + 1);
        break;
      }
    }
  }, [hintsUsed, correctAnswer, revealedChars]);

  // Keyboard
  useKeyboardShortcuts([
    {
      keys: ['Enter'],
      handler: () => {
        if (isChecked) {
          handleNext();
        } else {
          handleCheck();
        }
      },
    },
  ]);

  if (!currentItem) return null;

  // Dash placeholders
  const chars = [...correctAnswer];
  const dashDisplay = chars.map((char, i) => {
    if (char === ' ') return <span key={i} className="mx-1" />;
    if (revealedChars.has(i)) {
      return (
        <span key={i} className="inline-flex flex-col items-center mx-0.5">
          <span className="text-yellow-400 font-bold">{char}</span>
          <span className="w-5 h-0.5 bg-yellow-400 mt-0.5 rounded" />
        </span>
      );
    }
    if (isChecked && isCorrect === false) {
      return (
        <span key={i} className="inline-flex flex-col items-center mx-0.5">
          <span className="text-red-400 font-bold">{char}</span>
          <span className="w-5 h-0.5 bg-red-500 mt-0.5 rounded" />
        </span>
      );
    }
    return (
      <span key={i} className="inline-flex flex-col items-center mx-0.5">
        <span className="text-transparent select-none">—</span>
        <span className="w-5 h-0.5 bg-slate-600 mt-0.5 rounded" />
      </span>
    );
  });

  const TABS: Array<{ id: TypeInputType; label: string }> = [
    { id: 'reading', label: 'Cách đọc' },
    { id: 'hanviet', label: 'Âm Hán' },
  ];

  return (
    <div className="fixed inset-0 bg-[#0f1120] flex flex-col z-50">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-slate-800">
        <button
          onClick={onExit}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </button>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setInputType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${inputType === tab.id
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <TTSButton text={currentItem.word} size="sm" className="text-slate-400" />
      </div>

      {/* Vietnamese IME warning for Âm Hán */}
      {inputType === 'hanviet' && (
        <div className="bg-yellow-900/40 border-b border-yellow-800/50 px-4 py-2 text-xs text-yellow-400 text-center">
          Cần bật bộ gõ tiếng Việt để nhập Âm Hán
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Word display */}
          <div className="text-center mb-8">
            <div className="text-7xl font-bold text-white mb-3 tracking-wide select-none">
              {currentItem.word}
            </div>
            <div className="text-slate-400 text-lg">{currentItem.meaning}</div>
            {inputType === 'reading' && (
              <div className="text-slate-600 text-sm mt-1">Gõ romaji để nhập hiragana</div>
            )}
          </div>

          {/* Dash placeholders */}
          <div className="flex items-end justify-center flex-wrap mb-6 min-h-[40px]">
            {dashDisplay}
          </div>

          {/* Input field */}
          <div className="mb-4">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => {
                if (!isChecked) setUserInput(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (isChecked) {
                    handleNext();
                  } else {
                    handleCheck();
                  }
                }
              }}
              disabled={showSuccess}
              placeholder={
                inputType === 'reading'
                  ? 'Gõ romaji (vd: toshokan → としょかん)'
                  : 'Nhập âm Hán Việt...'
              }
              className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white text-center text-lg
                focus:outline-none focus:ring-2 transition-all
                ${isChecked && isCorrect === true
                  ? 'border-green-500 bg-green-950 focus:ring-green-500'
                  : isChecked && isCorrect === false
                    ? 'border-red-500 bg-red-950 focus:ring-red-500'
                    : 'border-slate-700 focus:ring-orange-500 focus:border-orange-500'
                }
                disabled:opacity-70`}
            />
          </div>

          {/* Feedback */}
          {isChecked && (
            <div className={`text-center text-sm font-medium mb-4
              ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {isCorrect
                ? 'Chính xác! ✓'
                : `Đáp án đúng: ${correctAnswer}`}
            </div>
          )}

          {/* Success flash */}
          {showSuccess && (
            <div className="text-center text-green-400 text-2xl font-bold mb-4 animate-pulse">
              ✓
            </div>
          )}

          {/* Hint text */}
          <p className="text-center text-xs text-slate-600 mb-4">
            Nhấn <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">Enter</kbd> để kiểm tra
            {isChecked && ' · Enter để tiếp theo'}
          </p>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleHint}
              disabled={hintsUsed >= MAX_HINTS || isChecked}
              className="flex-1 border border-slate-600 text-slate-400 rounded-xl py-3 text-sm font-medium
                hover:border-slate-500 hover:text-slate-300 transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              💡 Gợi ý ({hintsUsed}/{MAX_HINTS})
            </button>

            {!isChecked ? (
              <button
                onClick={handleCheck}
                disabled={!userInput.trim()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 text-sm font-semibold
                  transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Kiểm tra
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
              >
                {currentIndex < total - 1 ? 'Tiếp theo ›' : 'Bắt đầu lại'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom progress */}
      <div className="bg-[#161829] border-t border-slate-800 px-6 py-3 shrink-0">
        <div className="max-w-md mx-auto">
          <ProgressBar current={currentIndex + 1} total={total} colorClass="bg-orange-500" />
        </div>
      </div>
    </div>
  );
}
