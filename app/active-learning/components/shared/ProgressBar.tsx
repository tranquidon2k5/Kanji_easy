'use client';

interface ProgressBarProps {
  current: number;
  total: number;
  colorClass?: string;
  className?: string;
}

export default function ProgressBar({
  current,
  total,
  colorClass = 'bg-green-500',
  className = '',
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-sm text-slate-400 shrink-0 tabular-nums">
        {current} / {total}
      </span>
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
    </div>
  );
}
