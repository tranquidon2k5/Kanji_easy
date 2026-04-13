'use client';

import { useActiveLearningStore } from '@/store/activeLearningStore';
import DeckManager from './components/DeckManager';
import VocabInput from './components/VocabInput';
import VocabList from './components/VocabList';
import ModeSelector from './components/ModeSelector';
import Flashcard from './components/modes/Flashcard';
import Quiz from './components/modes/Quiz';
import TypeInput from './components/modes/TypeInput';

export default function ActiveLearningPage() {
  const { activeMode, setActiveMode, getActiveDeck } = useActiveLearningStore();
  const activeDeck = getActiveDeck();
  const items = activeDeck?.items ?? [];

  const handleExit = () => setActiveMode(null);

  // Render full-screen mode overlays
  if (activeMode === 'flashcard' && items.length > 0) {
    return <Flashcard items={items} onExit={handleExit} />;
  }
  if (activeMode === 'quiz' && items.length > 0) {
    return <Quiz items={items} onExit={handleExit} />;
  }
  if (activeMode === 'typeinput' && items.length > 0) {
    return <TypeInput items={items} onExit={handleExit} />;
  }

  return (
    <main className="min-h-screen bg-blue-50 bg-grid-pattern">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-1 tracking-tight">
            Học tự chủ
          </h1>
          <p className="text-slate-500">
            Tự nhập từ vựng và chọn chế độ học phù hợp
          </p>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-6">
          <DeckManager />
          <VocabInput />
          {items.length > 0 && <VocabList />}
          {activeDeck && <ModeSelector />}
        </div>

        {/* Sync status */}
        <p className="text-center text-xs text-slate-400 mt-8">
          ☁️ Dữ liệu được đồng bộ lên đám mây
        </p>
      </div>
    </main>
  );
}
