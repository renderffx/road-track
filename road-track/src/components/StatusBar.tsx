'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { usePushNotifications } from '@/lib/notifications';

export default function StatusBar() {
  const { reports, realTimeEnabled, setRealTimeEnabled } = useStore();
  const { requestPermission } = usePushNotifications();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            <span className="text-zinc-500">Loading...</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            <span className="text-zinc-500">GPS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            <span className="text-zinc-500">Sync</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-zinc-500">
          <span>0 total</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          <span className="text-zinc-500">Ready</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          <span className="text-zinc-500">GPS</span>
        </div>
        
        <button
          onClick={() => setRealTimeEnabled(!realTimeEnabled)}
          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          <span className="text-zinc-500">Sync</span>
        </button>
      </div>
      
      <div className="flex items-center gap-4 text-zinc-500">
        <span>{reports.length} total</span>
        <button
          onClick={requestPermission}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          title="Enable push notifications"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
      </div>
    </div>
  );
}
