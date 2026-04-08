'use client';

import { useState, useCallback } from 'react';

interface TTSButtonProps {
  text: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  shortcutLabel?: boolean;
}

const SIZE_MAP = {
  sm: { icon: 16, padding: 'p-1' },
  md: { icon: 20, padding: 'p-1.5' },
  lg: { icon: 26, padding: 'p-2' },
};

export default function TTSButton({
  text,
  className = '',
  size = 'md',
  shortcutLabel = false,
}: TTSButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const speak = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [text, isSupported]);

  const { icon, padding } = SIZE_MAP[size];

  return (
    <button
      onClick={speak}
      disabled={!isSupported}
      className={`flex items-center gap-1.5 rounded-full transition-all duration-200
        ${isSupported ? 'hover:text-blue-400 cursor-pointer' : 'opacity-40 cursor-not-allowed'}
        ${isSpeaking ? 'text-blue-400' : 'text-slate-400'}
        ${padding} ${className}`}
      title={isSupported ? `Phát âm: ${text}` : 'Trình duyệt không hỗ trợ TTS'}
      aria-label={`Nghe phát âm: ${text}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={icon}
        height={icon}
        fill="currentColor"
        viewBox="0 0 24 24"
        className={isSpeaking ? 'animate-pulse' : ''}
      >
        {isSpeaking ? (
          // Speaking icon with waves
          <>
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
            <path d="M19 12c0-2.97-1.61-5.55-4-6.93v13.86c2.39-1.38 4-3.96 4-6.93z" opacity="0.6" />
          </>
        ) : (
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
        )}
      </svg>
      {shortcutLabel && (
        <span className="text-xs bg-slate-700 text-slate-300 px-1 rounded leading-4">R</span>
      )}
    </button>
  );
}
