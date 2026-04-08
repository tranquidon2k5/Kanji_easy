'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useActiveLearningStore } from '@/store/activeLearningStore';

export default function DeckManager() {
  const { decks, activeDeckId, createDeck, renameDeck, deleteDeck, setActiveDeck } =
    useActiveLearningStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const newInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating && newInputRef.current) {
      newInputRef.current.focus();
    }
  }, [isCreating]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleCreateSubmit = useCallback(() => {
    const name = newDeckName.trim();
    createDeck(name || 'Bài mới');
    setNewDeckName('');
    setIsCreating(false);
  }, [newDeckName, createDeck]);

  const handleCreateKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleCreateSubmit();
      if (e.key === 'Escape') {
        setNewDeckName('');
        setIsCreating(false);
      }
    },
    [handleCreateSubmit]
  );

  const handleRenameSubmit = useCallback(
    (id: string) => {
      const name = editingName.trim();
      if (name) renameDeck(id, name);
      setEditingId(null);
      setEditingName('');
    },
    [editingName, renameDeck]
  );

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent, id: string) => {
      if (e.key === 'Enter') handleRenameSubmit(id);
      if (e.key === 'Escape') {
        setEditingId(null);
        setEditingName('');
      }
    },
    [handleRenameSubmit]
  );

  const startEditing = useCallback(
    (e: React.MouseEvent, id: string, name: string) => {
      e.stopPropagation();
      setEditingId(id);
      setEditingName(name);
      setConfirmDeleteId(null);
    },
    []
  );

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (confirmDeleteId === id) {
        deleteDeck(id);
        setConfirmDeleteId(null);
      } else {
        setConfirmDeleteId(id);
      }
    },
    [confirmDeleteId, deleteDeck]
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Danh sách bài</h2>
        <button
          onClick={() => {
            setIsCreating(true);
            setConfirmDeleteId(null);
          }}
          className="text-sm border border-slate-200 text-slate-600 rounded-lg px-3 py-1.5 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-1"
        >
          <span className="text-base leading-none">+</span> Tạo bài mới
        </button>
      </div>

      {/* Creating new deck input */}
      {isCreating && (
        <div className="mb-3 flex gap-2">
          <input
            ref={newInputRef}
            type="text"
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            onKeyDown={handleCreateKeyDown}
            onBlur={handleCreateSubmit}
            placeholder="Tên bài học..."
            className="flex-1 border border-blue-300 rounded-lg px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50"
          />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleCreateSubmit}
            className="text-sm bg-blue-500 text-white rounded-lg px-3 py-1.5 hover:bg-blue-600 transition-colors"
          >
            Tạo
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setNewDeckName(''); setIsCreating(false); }}
            className="text-sm border border-slate-200 text-slate-500 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
        </div>
      )}

      {/* Empty state */}
      {decks.length === 0 && !isCreating && (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mb-3 text-slate-300"
            width="40"
            height="40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
            />
          </svg>
          <p className="text-sm">Chưa có bài nào. Tạo bài mới để bắt đầu.</p>
        </div>
      )}

      {/* Deck list */}
      {decks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {decks.map((deck) => {
            const isActive = deck.id === activeDeckId;
            const isEditing = editingId === deck.id;
            const isPendingDelete = confirmDeleteId === deck.id;

            return (
              <div
                key={deck.id}
                onClick={() => {
                  if (!isEditing) {
                    setActiveDeck(deck.id);
                    setConfirmDeleteId(null);
                  }
                }}
                className={`
                  group relative flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer
                  transition-all duration-150 min-w-0
                  ${isActive
                    ? 'border-2 border-blue-500 bg-blue-50 shadow-sm'
                    : 'border border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                  }
                  ${isPendingDelete ? 'border-red-300 bg-red-50' : ''}
                `}
              >
                {isEditing ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => handleRenameKeyDown(e, deck.id)}
                    onBlur={() => handleRenameSubmit(deck.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="min-w-0 w-28 border border-blue-300 rounded px-1.5 py-0.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  />
                ) : (
                  <div className="flex flex-col min-w-0">
                    <span className={`text-sm font-medium truncate ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>
                      {deck.name}
                    </span>
                    <span className={`text-xs ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>
                      {deck.items.length} từ vựng
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 ml-1 shrink-0">
                  {/* Rename */}
                  {!isEditing && (
                    <button
                      onClick={(e) => startEditing(e, deck.id, deck.name)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-slate-400 hover:text-blue-500"
                      title="Đổi tên"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}

                  {/* Delete */}
                  {!isEditing && (
                    <button
                      onClick={(e) => handleDeleteClick(e, deck.id)}
                      className={`transition-all p-0.5 rounded
                        ${isPendingDelete
                          ? 'text-red-500 opacity-100'
                          : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500'
                        }`}
                      title={isPendingDelete ? 'Nhấn lại để xác nhận xoá' : 'Xoá bài'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Confirm delete tooltip */}
                {isPendingDelete && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 pointer-events-none">
                    Nhấn X lần nữa để xoá
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
