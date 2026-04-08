'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { VocabularyItem, QuizType } from '@/types/vocabulary';
import TTSButton from '../shared/TTSButton';
import ProgressBar from '../shared/ProgressBar';
import { useKeyboardShortcuts } from '../shared/KeyboardShortcuts';

interface QuizProps {
  items: VocabularyItem[];
  onExit: () => void;
}

export const WRONG_MESSAGES = [
  'Ôi không! Học lại đi bạn ơi 😅',
  'Đúng là muối bỏ biển mà :))',
  'Hụt rồi! Cố lên nào! 💪',
  'Sai thì học lại, không sao! 😄',
  'Hmm, còn phải cố thêm 🌸',
  'Gần đúng mà chưa đúng đâu 🫠',
];

export const CORRECT_MESSAGES = [
  'Tuyệt cà là vời! 🎉',
  'Xuất sắc! ✨',
  'Đỉnh của chóp! 🔥',
  'Chuẩn không cần chỉnh! 💯',
  'Hay lắm! 👏',
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildOptions(
  correct: VocabularyItem,
  all: VocabularyItem[],
  quizType: QuizType
): VocabularyItem[] {
  const distractors = shuffleArray(all.filter((i) => i.id !== correct.id)).slice(0, 3);
  return shuffleArray([correct, ...distractors]);
}

export default function Quiz({ items, onExit }: QuizProps) {
  const [quizType, setQuizType] = useState<QuizType>('reading');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [shuffledItems] = useState(() => shuffleArray(items));

  const currentItem = shuffledItems[currentIndex];
  const total = shuffledItems.length;

  const options = useMemo(
    () => buildOptions(currentItem, items, quizType),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentItem?.id, quizType]
  );

  const isAnswered = selectedAnswer !== null;

  const getOptionLabel = useCallback(
    (item: VocabularyItem): string => {
      if (quizType === 'reading') return item.reading;
      if (quizType === 'kanji') return item.word;
      return item.meaning;
    },
    [quizType]
  );

  const handleAnswer = useCallback(
    (itemId: string) => {
      if (isAnswered) return;
      setSelectedAnswer(itemId);
      if (itemId === currentItem.id) {
        setScore((s) => s + 1);
        setFeedback(pickRandom(CORRECT_MESSAGES));
      } else {
        setFeedback(pickRandom(WRONG_MESSAGES));
      }
    },
    [isAnswered, currentItem]
  );

  const handleNext = useCallback(() => {
    setSelectedAnswer(null);
    setFeedback(null);
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // wrap around
      setCurrentIndex(0);
      setScore(0);
    }
  }, [currentIndex, total]);

  const handleSkip = useCallback(() => {
    setSelectedAnswer(null);
    setFeedback(null);
    setCurrentIndex((i) => (i + 1) % total);
  }, [total]);

  // Keyboard
  useKeyboardShortcuts([
    {
      keys: ['Digit1', '1'],
      handler: () => options[0] && handleAnswer(options[0].id),
      ignoreWhenTyping: true,
    },
    {
      keys: ['Digit2', '2'],
      handler: () => options[1] && handleAnswer(options[1].id),
      ignoreWhenTyping: true,
    },
    {
      keys: ['Digit3', '3'],
      handler: () => options[2] && handleAnswer(options[2].id),
      ignoreWhenTyping: true,
    },
    {
      keys: ['Digit4', '4'],
      handler: () => options[3] && handleAnswer(options[3].id),
      ignoreWhenTyping: true,
    },
    {
      keys: ['Space'],
      handler: () => { if (isAnswered) handleNext(); },
      ignoreWhenTyping: true,
    },
  ]);

  if (items.length < 4) {
    return (
      <div className="fixed inset-0 bg-[#0f1120] flex items-center justify-center z-50">
        <div className="text-center text-white px-4">
          <p className="text-xl mb-4">Cần ít nhất 4 từ vựng để chơi Trắc nghiệm</p>
          <button onClick={onExit} className="text-green-400 hover:text-green-300 underline">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const isCorrect = selectedAnswer === currentItem.id;

  const QUIZ_TABS: Array<{ id: QuizType; label: string }> = [
    { id: 'reading', label: 'Cách đọc' },
    { id: 'kanji', label: 'Kanji' },
    { id: 'meaning', label: 'Ý nghĩa' },
  ];

  const getQuestionDisplay = () => {
    if (quizType === 'reading') {
      return (
        <div className="text-center">
          <p className="text-slate-400 text-sm mb-2">Chọn cách đọc của từ:</p>
          <p className="text-5xl font-bold text-white mb-2">{currentItem.word}</p>
          <p className="text-slate-400 text-sm">{currentItem.meaning}</p>
        </div>
      );
    }
    if (quizType === 'kanji') {
      return (
        <div className="text-center">
          <p className="text-slate-400 text-sm mb-2">Chọn chữ Kanji đúng:</p>
          <p className="text-3xl text-blue-300 mb-1">{currentItem.reading}</p>
          <p className="text-slate-400 text-sm">{currentItem.meaning}</p>
        </div>
      );
    }
    return (
      <div className="text-center">
        <p className="text-slate-400 text-sm mb-2">Từ này có nghĩa là gì?</p>
        <p className="text-5xl font-bold text-white mb-2">{currentItem.word}</p>
        <p className="text-blue-300 text-xl">{currentItem.reading}</p>
      </div>
    );
  };

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

        {/* Quiz type tabs */}
        <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
          {QUIZ_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setQuizType(tab.id);
                setSelectedAnswer(null);
                setFeedback(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${quizType === tab.id
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TTS hint */}
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <TTSButton text={currentItem.word} size="sm" />
          <span className="hidden sm:inline">Bí quá thì nghe</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Question */}
          <div className="bg-[#1e2235] rounded-2xl p-8 mb-6 min-h-[140px] flex items-center justify-center">
            {getQuestionDisplay()}
          </div>

          {/* Feedback message */}
          {feedback && (
            <div className={`text-center text-sm font-medium mb-4 transition-all
              ${isCorrect ? 'text-green-400' : 'text-orange-400'}`}>
              {feedback}
            </div>
          )}

          {/* Answer options */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {options.map((option, idx) => {
              const label = getOptionLabel(option);
              const isSelected = selectedAnswer === option.id;
              const isThisCorrect = option.id === currentItem.id;

              let style = 'bg-[#1e2235] border border-slate-700 text-white hover:border-slate-500';
              if (isAnswered) {
                if (isThisCorrect) {
                  style = 'bg-green-900 border-2 border-green-500 text-green-300';
                } else if (isSelected && !isThisCorrect) {
                  style = 'bg-red-900 border-2 border-red-500 text-red-300';
                } else {
                  style = 'bg-[#1e2235] border border-slate-700 text-slate-500';
                }
              }

              return (
                <button
                  key={option.id}
                  onClick={() => handleAnswer(option.id)}
                  disabled={isAnswered}
                  className={`relative flex items-start gap-3 rounded-xl px-4 py-3 text-left transition-all text-sm font-medium
                    ${style} disabled:cursor-default`}
                >
                  <span className={`w-6 h-6 shrink-0 rounded-lg text-xs flex items-center justify-center font-bold
                    ${isAnswered
                      ? isThisCorrect ? 'bg-green-700 text-green-200' : isSelected ? 'bg-red-700 text-red-200' : 'bg-slate-700 text-slate-500'
                      : 'bg-slate-700 text-slate-300'
                    }`}>
                    {idx + 1}
                  </span>
                  <span className="flex-1 leading-snug">{label}</span>
                  {isAnswered && isThisCorrect && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="text-green-400 shrink-0 mt-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isAnswered && isSelected && !isThisCorrect && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="text-red-400 shrink-0 mt-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action row */}
          <div className="flex items-center gap-3">
            {isAnswered ? (
              <button
                onClick={handleNext}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {currentIndex < total - 1 ? (
                  <>Tiếp theo <span>›</span></>
                ) : (
                  <>Chơi lại từ đầu</>
                )}
              </button>
            ) : (
              <button
                onClick={handleSkip}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" opacity=".3"/>
                </svg>
                Câu này bó tay
              </button>
            )}

            <div className="flex-1">
              <ProgressBar current={currentIndex + 1} total={total} colorClass="bg-green-500" />
            </div>

            <span className="text-xs text-slate-500 shrink-0">
              {score}/{total} đúng
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
