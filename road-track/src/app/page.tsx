'use client';

import { useState, useEffect } from 'react';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && user) {
      setShowModal(false);
      if (user.role === 'admin') router.push('/admin');
      else if (user.role === 'field_worker') router.push('/worker');
      else router.push('/citizen');
    }
  }, [user, mounted, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {showModal && <AuthModal onClose={() => setShowModal(false)} />}

      <header className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold tracking-tight">RoadTrack</h1>
              <p className="text-xs text-zinc-500">Report Infrastructure Issues</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/transparency" className="px-3 sm:px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
              <span className="hidden sm:inline">Transparency</span>
              <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </Link>
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
                  <span className="text-sm font-medium text-zinc-300">{user.name}</span>
                  <span className="text-xs text-zinc-500 capitalize">{user.role.replace('_', ' ')}</span>
                </div>
                <button
                  onClick={() => { logout(); window.location.href = '/'; }}
                  className="px-3 sm:px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-all border border-red-500/20"
                >
                  <span className="hidden sm:inline">Logout</span>
                  <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-sm transition-all shadow-lg shadow-amber-500/25 active:scale-95"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live Data Available
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-white via-white to-zinc-500 bg-clip-text text-transparent">Report.</span>
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent"> Track.</span>
              <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent"> Fix.</span>
            </h1>
            <p className="text-lg sm:text-xl text-zinc-400 max-w-xl mx-auto mb-8 sm:mb-10">
              The most complete public infrastructure damage reporting system.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={() => setShowModal(true)}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-base transition-all shadow-xl shadow-amber-500/30 active:scale-95"
              >
                Start Reporting
              </button>
              <Link
                href="/transparency"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold text-base transition-all border border-white/10 hover:border-white/20"
              >
                View Live Data
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { v: '50+', l: 'Reports', icon: '📊' },
              { v: '26', l: 'Features', icon: '⚡' },
              { v: '3', l: 'Roles', icon: '👥' },
              { v: '0', l: 'DB', icon: '🔒' },
            ].map((s, i) => (
              <div
                key={i}
                className="group p-4 sm:p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all cursor-pointer"
              >
                <div className="text-2xl sm:text-3xl mb-2">{s.icon}</div>
                <div className="text-2xl sm:text-3xl font-bold">{s.v}</div>
                <div className="text-xs sm:text-sm text-zinc-500">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="mt-16 sm:mt-24 grid sm:grid-cols-3 gap-4">
            {[
              { t: '📸', h: 'Easy Reporting', d: 'Snap a photo, mark the location, submit in seconds' },
              { t: '🔔', h: 'Real-time Updates', d: 'Get notified as your report moves through the system' },
              { t: '📈', h: 'Full Transparency', d: 'Track progress and see exactly when issues are fixed' },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/5">
                <div className="text-3xl mb-3">{f.t}</div>
                <h3 className="font-bold text-lg mb-2">{f.h}</h3>
                <p className="text-sm text-zinc-500">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <span>RoadTrack</span>
              <span className="text-zinc-700">•</span>
              <span>Open Source</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/transparency" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Transparency</Link>
              <Link href="/citizen" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Citizen</Link>
              <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Admin</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
