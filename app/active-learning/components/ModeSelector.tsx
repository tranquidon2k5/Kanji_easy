'use client';

import { useActiveLearningStore } from '@/store/activeLearningStore';
import { LearningMode } from '@/types/vocabulary';

const MODE_CONFIG: Array<{
  id: LearningMode;
  label: string;
  description: string;
  buttonLabel: string;
  cardClass: string;
  buttonClass: string;
  iconColor: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'flashcard',
    label: 'Flashcard',
    description: 'Lật thẻ để xem đáp án. Phù hợp để làm quen với từ vựng mới.',
    buttonLabel: 'Bắt đầu Flashcard',
    cardClass: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    buttonClass: 'bg-blue-500 hover:bg-blue-600 text-white',
    iconColor: 'text-blue-400',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <rect x="2" y="5" width="15" height="11" rx="2" />
        <rect x="7" y="8" width="15" height="11" rx="2" className="opacity-50" />
      </svg>
    ),
  },
  {
    id: 'quiz',
    label: 'Trắc nghiệm',
    description: 'Xem từ vựng, chọn cách đọc. Kiểm tra nhanh kiến thức.',
    buttonLabel: 'Bắt đầu Trắc nghiệm',
    cardClass: 'bg-green-50 border-green-200 hover:border-green-400',
    buttonClass: 'bg-green-500 hover:bg-green-600 text-white',
    iconColor: 'text-green-400',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="3" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="21" />
        <line x1="3" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="21" y2="12" />
      </svg>
    ),
  },
  {
    id: 'typeinput',
    label: 'Nhồi nhét',
    description: 'Gõ đáp án để ghi nhớ sâu hơn. Dành cho người muốn thử thách.',
    buttonLabel: 'Bắt đầu Nhồi nhét',
    cardClass: 'bg-orange-50 border-orange-200 hover:border-orange-400',
    buttonClass: 'bg-orange-500 hover:bg-orange-600 text-white',
    iconColor: 'text-orange-400',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

export default function ModeSelector() {
  const { getActiveDeck, setActiveMode } = useActiveLearningStore();
  const activeDeck = getActiveDeck();
  const itemCount = activeDeck?.items.length ?? 0;
  const hasItems = itemCount > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      {/* Vietnamese IME warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5 mb-4 text-sm text-yellow-700 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="shrink-0">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <span>Dùng bộ gõ tiếng Việt cho chế độ học nhồi nhét (Âm Hán)</span>
      </div>

      <h2 className="text-lg font-semibold text-slate-800 mb-3">Chọn chế độ học</h2>

      {/* No items warning */}
      {!hasItems && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5 mb-4 text-sm text-yellow-700 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="shrink-0">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
          Cần ít nhất 1 từ vựng để bắt đầu học
        </div>
      )}

      {/* Mode cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MODE_CONFIG.map((mode) => (
          <div
            key={mode.id}
            className={`border rounded-2xl p-5 flex flex-col gap-3 transition-all duration-150 ${mode.cardClass}
              ${!hasItems ? 'opacity-60' : ''}`}
          >
            <div className={`${mode.iconColor}`}>{mode.icon}</div>
            <span className="font-semibold text-slate-800">{mode.label}</span>
            <p className="text-sm text-slate-600 flex-1 leading-relaxed">{mode.description}</p>
            <button
              onClick={() => hasItems && setActiveMode(mode.id)}
              disabled={!hasItems}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors
                ${mode.buttonClass}
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {mode.buttonLabel}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
