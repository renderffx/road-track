'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import AuthModal from '@/components/auth/AuthModal';
import CitizenDashboard from '@/components/citizen/CitizenDashboard';

export default function CitizenPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setShowAuth(true);
    }
    if (!loading && user && user.role !== 'citizen') {
      if (user.role === 'admin') router.push('/admin');
      else if (user.role === 'field_worker') router.push('/worker');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-pulse text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950">
        {showAuth && <AuthModal />}
        <div className="flex items-center justify-center h-screen">
          <button
            onClick={() => setShowAuth(true)}
            className="px-6 py-3 rounded-lg bg-white text-black font-semibold"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold">RoadTrack</h1>
              <p className="text-xs text-zinc-500">Citizen Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800">
              <span className="text-yellow-400 text-sm">★</span>
              <span className="text-sm font-medium">{user.citizenPoints} pts</span>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <CitizenDashboard userId={user.id} userName={user.name} />
    </div>
  );
}
