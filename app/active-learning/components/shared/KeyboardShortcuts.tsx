'use client';

import { useEffect, useCallback } from 'react';

// Keyboard shortcut definitions per mode
// Used as a reusable hook — NOT a visual component
// The visual hint bar is rendered inline in each mode component

export type ShortcutHandler = (key: string) => void;

export interface KeyboardShortcutConfig {
  /** Keys to listen for (e.g. 'Space', 'KeyZ', 'Digit1') */
  keys: string[];
  /** Handler called with the key code */
  handler: ShortcutHandler;
  /** Disable shortcuts when user is typing in an input/textarea */
  ignoreWhenTyping?: boolean;
}

/**
 * Hook to register keyboard shortcuts for learning modes
 *
 * Usage:
 * useKeyboardShortcuts([
 *   { keys: ['Space'], handler: handleFlip, ignoreWhenTyping: true },
 *   { keys: ['KeyZ'], handler: handleKnow, ignoreWhenTyping: true },
 *   { keys: ['KeyX'], handler: handleUnknown, ignoreWhenTyping: true },
 *   { keys: ['KeyR'], handler: handleTTS },
 * ]);
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcutConfig[]): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        if (shortcut.keys.includes(event.code) || shortcut.keys.includes(event.key)) {
          if (shortcut.ignoreWhenTyping && isTyping) continue;
          event.preventDefault();
          shortcut.handler(event.code);
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Shortcut key → label mapping for UI display
export const SHORTCUT_LABELS: Record<string, string> = {
  Space: 'Space',
  KeyZ: 'Z',
  KeyX: 'X',
  KeyR: 'R',
  KeyC: 'C',
  Digit1: '1',
  Digit2: '2',
  Digit3: '3',
  Digit4: '4',
  Enter: 'Enter',
  ArrowLeft: '←',
  ArrowRight: '→',
};
