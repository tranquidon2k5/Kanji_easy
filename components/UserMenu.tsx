'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useActiveLearningStore } from '@/store/activeLearningStore';

export default function UserMenu() {
  const router = useRouter();
  const { user, clearUser } = useAuthStore();
  const { resetStore } = useActiveLearningStore();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) return null;

  const initial = user.email?.[0]?.toUpperCase() ?? '?';

  async function handleLogout() {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    resetStore();
    clearUser();
    router.push('/login');
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Menu người dùng"
      >
        <span className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white font-semibold text-sm">
          {initial}
        </span>
        <span className="text-white/80 text-sm hidden sm:block max-w-[160px] truncate">
          {user.email}
        </span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-20 w-52 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs text-gray-400">Đang đăng nhập</p>
              <p className="text-sm font-medium text-gray-800 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
