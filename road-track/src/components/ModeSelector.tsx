'use client';

import { useStore } from '@/store';
import { AppMode } from '@/types';

const modes: { id: AppMode; label: string; icon: React.ReactNode }[] = [
  { 
    id: 'report', 
    label: 'Report',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M5 12h14" />
      </svg>
    )
  },
  { 
    id: 'reports', 
    label: 'Reports',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
      </svg>
    )
  },
];

export default function ModeSelector() {
  const { mode, setMode } = useStore();

  return (
    <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1.5">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center
            ${mode === m.id 
              ? 'bg-white dark:bg-zinc-700 shadow-sm text-black dark:text-white' 
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }
          `}
        >
          {m.icon}
          <span className="hidden sm:inline">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
