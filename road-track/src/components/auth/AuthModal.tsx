'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';

const demoAccounts = [
  { role: 'admin', email: 'admin@roadtrack.com', password: 'admin123', label: 'Admin Dashboard', icon: '⚙️' },
  { role: 'field_worker', email: 'worker@roadtrack.com', password: 'worker123', label: 'Worker Portal', icon: '🔧' },
  { role: 'citizen', email: 'citizen1@example.com', password: 'citizen123', label: 'Citizen App', icon: '👤' },
];

export default function AuthModal({ onClose }: { onClose?: () => void }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'select' | 'login' | 'register'>('select');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.CITIZEN);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = async (account: typeof demoAccounts[0]) => {
    setLoading(true);
    setError('');
    const success = await login(account.email, account.password);
    if (success) {
      if (account.role === 'admin') window.location.href = '/admin';
      else if (account.role === 'field_worker') window.location.href = '/worker';
      else window.location.href = '/citizen';
    } else {
      setError('Invalid credentials');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let success: boolean;
    if (mode === 'login') {
      success = await login(email, password);
      if (!success) setError('Invalid email or password');
    } else {
      if (password.length < 4) {
        setError('Password must be at least 4 characters');
        setLoading(false);
        return;
      }
      success = await register({ email, password, name, role: selectedRole });
      if (!success) setError('Registration failed. Email may already be in use.');
    }

    setLoading(false);
    if (success) {
      if (selectedRole === 'admin' || (mode === 'login' && email.includes('admin'))) window.location.href = '/admin';
      else if (selectedRole === 'field_worker' || (mode === 'login' && email.includes('worker'))) window.location.href = '/worker';
      else window.location.href = '/citizen';
    }
  };

  const handleClose = onClose || (() => {});

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h2 className="text-xl font-bold">RoadTrack</h2>
            </div>
            <button onClick={handleClose} className="text-zinc-400 hover:text-zinc-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {mode === 'select' && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-500 mb-4">Choose how you want to continue:</p>
              
              {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{error}</div>}

              <div className="space-y-3">
                {demoAccounts.map((account) => (
                  <button
                    key={account.role}
                    onClick={() => handleDemoLogin(account)}
                    disabled={loading}
                    className="w-full p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all flex items-center gap-4 disabled:opacity-50"
                  >
                    <span className="text-2xl">{account.icon}</span>
                    <div className="text-left">
                      <div className="font-semibold text-sm">{account.label}</div>
                      <div className="text-xs text-zinc-500">{account.email}</div>
                    </div>
                    {loading && loading ? (
                      <div className="ml-auto w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="ml-auto w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200 dark:border-zinc-700" /></div>
                <div className="relative flex justify-center text-xs"><span className="px-2 bg-white dark:bg-zinc-900 text-zinc-500">or</span></div>
              </div>

              <button
                onClick={() => setMode('register')}
                className="w-full py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold hover:opacity-90 transition-opacity"
              >
                Create New Account
              </button>
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <button type="button" onClick={() => setMode('select')} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                Back to options
              </button>

              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">I am a...</label>
                    <select value={selectedRole} onChange={e => setSelectedRole(e.target.value as UserRole)} className="w-full px-4 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500">
                      <option value={UserRole.CITIZEN}>Citizen</option>
                      <option value={UserRole.FIELD_WORKER}>Field Worker</option>
                      <option value={UserRole.ADMIN}>Admin</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500" required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500" required />
              </div>

              {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{error}</div>}

              <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-opacity disabled:opacity-50">
                {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
