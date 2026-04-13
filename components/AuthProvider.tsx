'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useActiveLearningStore } from '@/store/activeLearningStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, clearUser } = useAuthStore();
  const { loadDecks, resetStore } = useActiveLearningStore();

  useEffect(() => {
    const supabase = createClient();

    // Initial session load
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        loadDecks(user.id).catch(console.error);
      } else {
        clearUser();
      }
    });

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadDecks(session.user.id).catch(console.error);
      } else {
        clearUser();
        resetStore();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, clearUser, loadDecks, resetStore]);

  return <>{children}</>;
}
