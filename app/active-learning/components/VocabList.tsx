'use client';

import { useState, useCallback } from 'react';
import { useActiveLearningStore } from '@/store/activeLearningStore';
import { VocabularyItem } from '@/types/vocabulary';

export default function VocabList() {
  const { getActiveDeck, activeDeckId, updateItem, deleteItem, clearItems } =
    useActiveLearningStore();
  const activeDeck = getActiveDeck();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Omit<VocabularyItem, 'id'>>({
    word: '',
    reading: '',
    hanviet: '',
    meaning: '',
  });
  const [confirmClear, setConfirmClear] = useState(false);

  const items = activeDeck?.items ?? [];

  const startEdit = useCallback((item: VocabularyItem) => {
    setEditingId(item.id);
    setEditForm({
      word: item.word,
      reading: item.reading,
      hanviet: item.hanviet,
      meaning: item.meaning,
    });
    setConfirmClear(false);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingId || !activeDeckId) return;
    const word = editForm.word.trim();
    const reading = editForm.reading.trim();
    const hanviet = editForm.hanviet.trim();
    const meaning = editForm.meaning.trim();
    if (!word || !reading || !hanviet || !meaning) return;
    updateItem(activeDeckId, { id: editingId, word, reading, hanviet, meaning });
    setEditingId(null);
  }, [editingId, activeDeckId, editForm, updateItem]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      if (!activeDeckId) return;
      deleteItem(activeDeckId, id);
      if (editingId === id) setEditingId(null);
    },
    [activeDeckId, deleteItem, editingId]
  );

  const handleClearAll = useCallback(() => {
    if (!activeDeckId) return;
    if (confirmClear) {
      clearItems(activeDeckId);
      setConfirmClear(false);
      setEditingId(null);
    } else {
      setConfirmClear(true);
    }
  }, [activeDeckId, clearItems, confirmClear]);

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">
          Danh sách từ vựng{' '}
          <span className="text-slate-400 font-normal text-base">({items.length})</span>
        </h2>
        <button
          onClick={handleClearAll}
          className={`text-sm flex items-center gap-1 transition-colors
            ${confirmClear
              ? 'text-red-600 font-semibold'
              : 'text-red-400 hover:text-red-600'
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
          {confirmClear ? 'Nhấn lần nữa để xoá tất cả' : 'Xoá tất cả'}
        </button>
      </div>

      {/* Confirm banner */}
      {confirmClear && (
        <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600 flex items-center justify-between">
          <span>Xoá toàn bộ {items.length} từ vựng? Không thể hoàn tác!</span>
          <button
            onClick={() => setConfirmClear(false)}
            className="text-red-400 hover:text-red-600 ml-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto max-h-80 overflow-y-auto rounded-lg border border-slate-100">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="sticky top-0 bg-slate-50 z-10">
            <tr>
              <th className="text-left px-3 py-2 text-slate-500 font-medium text-xs uppercase tracking-wider w-1/5">Kanji</th>
              <th className="text-left px-3 py-2 text-slate-500 font-medium text-xs uppercase tracking-wider w-1/5">Cách đọc</th>
              <th className="text-left px-3 py-2 text-green-600 font-semibold text-xs uppercase tracking-wider w-1/5">Hán Việt</th>
              <th className="text-left px-3 py-2 text-slate-500 font-medium text-xs uppercase tracking-wider">Nghĩa</th>
              <th className="px-3 py-2 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((item, idx) => (
              <tr
                key={item.id}
                className={`group transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/40`}
              >
                {editingId === item.id ? (
                  <>
                    <td className="px-2 py-1.5">
                      <input
                        value={editForm.word}
                        onChange={(e) => setEditForm((f) => ({ ...f, word: e.target.value }))}
                        className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        placeholder="Kanji"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        value={editForm.reading}
                        onChange={(e) => setEditForm((f) => ({ ...f, reading: e.target.value }))}
                        className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        placeholder="がっこう"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        value={editForm.hanviet}
                        onChange={(e) => setEditForm((f) => ({ ...f, hanviet: e.target.value }))}
                        className="w-full border border-green-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                        placeholder="Học Hiệu"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        value={editForm.meaning}
                        onChange={(e) => setEditForm((f) => ({ ...f, meaning: e.target.value }))}
                        className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        placeholder="Nghĩa"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex gap-1">
                        <button
                          onClick={saveEdit}
                          className="p-1 text-green-500 hover:text-green-600 rounded"
                          title="Lưu"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded"
                          title="Hủy"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2.5 font-medium text-slate-800">{item.word}</td>
                    <td className="px-3 py-2.5 text-blue-500">{item.reading}</td>
                    <td className="px-3 py-2.5 text-green-600 font-semibold uppercase text-xs tracking-wide">{item.hanviet}</td>
                    <td className="px-3 py-2.5 text-slate-600">{item.meaning}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1 text-slate-400 hover:text-blue-500 rounded transition-colors"
                          title="Sửa"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                          title="Xoá"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
