'use client';

import { useState, useCallback, useEffect } from 'react';
import { useActiveLearningStore } from '@/store/activeLearningStore';
import { parseVocabJSON, formatWithAI, AIFormatError } from '@/lib/aiFormat';
import { isDeckFull, isDeckNearFull, MAX_ITEMS_PER_DECK } from '@/lib/storage';

const DEMO_DATA = JSON.stringify(
  [
    { word: '学校', reading: 'がっこう', hanviet: 'Học Hiệu', meaning: 'Trường học' },
    { word: '先生', reading: 'せんせい', hanviet: 'Tiên Sinh', meaning: 'Giáo viên, thầy/cô' },
    { word: '学生', reading: 'がくせい', hanviet: 'Học Sinh', meaning: 'Học sinh, sinh viên' },
    { word: '日本語', reading: 'にほんご', hanviet: 'Nhật Bản Ngữ', meaning: 'Tiếng Nhật' },
    { word: '勉強', reading: 'べんきょう', hanviet: 'Miễn Cưỡng', meaning: 'Học tập' },
    { word: '図書館', reading: 'としょかん', hanviet: 'Đồ Thư Quán', meaning: 'Thư viện' },
    { word: 'コンビニ', reading: 'こんびに', hanviet: '(ngoại lai)', meaning: 'Cửa hàng tiện lợi' },
    { word: '電車', reading: 'でんしゃ', hanviet: 'Điện Xa', meaning: 'Tàu điện' },
    { word: '友達', reading: 'ともだち', hanviet: 'Hữu Đạt', meaning: 'Bạn bè' },
    { word: '食べ物', reading: 'たべもの', hanviet: 'Thực Vật', meaning: 'Đồ ăn, thức ăn' },
    { word: '飲み物', reading: 'のみもの', hanviet: 'Ẩm Vật', meaning: 'Đồ uống' },
    { word: '会社', reading: 'かいしゃ', hanviet: 'Hội Xã', meaning: 'Công ty' },
  ],
  null,
  2
);

export default function VocabInput() {
  const { activeDeckId, addItems, undoLastImport, getActiveDeck } = useActiveLearningStore();
  const activeDeck = getActiveDeck();

  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Auto-dismiss success toast
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const handleImport = useCallback(() => {
    setError(null);
    setWarning(null);

    if (!activeDeckId) {
      setError('Chọn bài học trước khi nhập từ vựng.');
      return;
    }
    if (!value.trim()) {
      setError('Vui lòng nhập dữ liệu JSON trước.');
      return;
    }

    let parsed: Array<{ word: string; reading: string; hanviet: string; meaning: string }>;
    try {
      parsed = parseVocabJSON(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dữ liệu không hợp lệ.');
      return;
    }

    const currentCount = activeDeck?.items.length ?? 0;

    if (isDeckFull(currentCount)) {
      setError(`Bài học đã đầy (${MAX_ITEMS_PER_DECK} từ). Xoá bớt từ để nhập thêm.`);
      return;
    }

    const afterCount = currentCount + parsed.length;
    if (isDeckNearFull(afterCount)) {
      setWarning(`Sắp đạt giới hạn ${MAX_ITEMS_PER_DECK} từ/bài (hiện tại: ${afterCount}).`);
    }

    const added = addItems(parsed);
    setSuccessMsg(`Đã thêm ${added} từ vựng thành công!`);
    setShowUndo(true);
    setValue('');
  }, [activeDeckId, activeDeck, value, addItems]);

  const handleUndo = useCallback(() => {
    if (!activeDeckId) return;
    undoLastImport(activeDeckId);
    setShowUndo(false);
    setSuccessMsg(null);
  }, [activeDeckId, undoLastImport]);

  const handleAIFormat = useCallback(async () => {
    setError(null);
    if (!value.trim()) {
      setError('Vui lòng nhập nội dung cần chuyển đổi.');
      return;
    }
    setIsAILoading(true);
    try {
      const result = await formatWithAI(value);
      setValue(JSON.stringify(result, null, 2));
    } catch (e) {
      setError(
        e instanceof AIFormatError
          ? e.message
          : 'Có lỗi xảy ra khi gọi AI. Vui lòng thử lại.'
      );
    } finally {
      setIsAILoading(false);
    }
  }, [value]);

  const noActiveDeck = !activeDeckId;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-800">Nhập từ vựng (JSON)</h2>
          <button
            onClick={() => setShowHelp((v) => !v)}
            className="w-5 h-5 rounded-full border border-slate-300 text-slate-400 text-xs flex items-center justify-center hover:border-blue-400 hover:text-blue-500 transition-colors"
            title="Định dạng JSON chuẩn"
          >
            ?
          </button>
        </div>
        <button
          onClick={() => setValue(DEMO_DATA)}
          className="text-sm border border-orange-300 text-orange-500 rounded-lg px-3 py-1.5 hover:bg-orange-50 transition-colors flex items-center gap-1"
        >
          <span>▷</span> Dùng thử demo
        </button>
      </div>

      {/* Help panel */}
      {showHelp && (
        <div className="mb-3 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 font-mono leading-relaxed">
          <p className="font-sans font-semibold text-slate-700 mb-1">Định dạng chuẩn:</p>
          <pre className="whitespace-pre-wrap text-slate-500">
{`[
  {
    "word": "学校",
    "reading": "がっこう",
    "hanviet": "Học Hiệu",
    "meaning": "Trường học"
  }
]`}
          </pre>
        </div>
      )}

      {/* No deck warning */}
      {noActiveDeck && (
        <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5 text-sm text-yellow-700 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          Chọn bài học trước khi nhập từ vựng
        </div>
      )}

      {/* Textarea */}
      <textarea
        value={value}
        onChange={(e) => { setValue(e.target.value); setError(null); }}
        className="w-full h-52 rounded-xl p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-900 text-green-300 placeholder:text-slate-600 border border-slate-700 leading-relaxed"
        placeholder={`[\n  {\n    "word": "学校",\n    "reading": "がっこう",\n    "hanviet": "Học Hiệu",\n    "meaning": "Trường học"\n  }\n]`}
        spellCheck={false}
      />

      {/* Error banner */}
      {error && (
        <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-600 flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Warning banner */}
      {warning && !error && (
        <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5 text-sm text-yellow-700 flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
          <span>{warning}</span>
        </div>
      )}

      {/* Success toast */}
      {successMsg && (
        <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm text-green-700 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          {successMsg}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mt-4">
        <button
          onClick={handleImport}
          disabled={noActiveDeck || isAILoading}
          className="flex items-center gap-2 bg-blue-500 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
          Nhập dữ liệu vào hệ thống
        </button>

        <button
          onClick={handleAIFormat}
          disabled={isAILoading}
          className="flex items-center gap-2 border border-purple-300 text-purple-600 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAILoading ? (
            <>
              <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Đang xử lý...
            </>
          ) : (
            <>
              <span>✦</span> AI Format
            </>
          )}
        </button>

        {showUndo && (
          <button
            onClick={handleUndo}
            className="flex items-center gap-2 border border-orange-300 text-orange-500 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-orange-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
            </svg>
            Bỏ nhập
          </button>
        )}
      </div>
    </div>
  );
}
