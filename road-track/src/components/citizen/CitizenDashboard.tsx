'use client';

import { useState, useEffect } from 'react';
import { Report, ReportStatus, DamageType, DAMAGE_TYPE_LABELS, REPORT_STATUS_LABELS, REPORT_STATUS_COLORS, CitizenTab } from '@/types';
import toast from 'react-hot-toast';

interface CitizenDashboardProps {
  userId: string;
  userName: string;
}

export default function CitizenDashboard({ userId, userName }: CitizenDashboardProps) {
  const [tab, setTab] = useState<CitizenTab>('report');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const res = await fetch(`/api/reports?userId=${userId}&limit=100`);
      const data = await res.json();
      setReports(data.reports || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex gap-1 bg-zinc-800/50 rounded-xl p-1 mb-6">
        {([['report', '📸 Report'], ['tracker', '📊 Tracker'], ['feed', '🗺️ Feed'], ['profile', '👤 Profile']] as [CitizenTab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === key ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'report' && <ReportTab userId={userId} onSuccess={() => { loadReports(); setTab('tracker'); }} />}
      {tab === 'tracker' && <TrackerTab reports={reports} loading={loading} />}
      {tab === 'feed' && <FeedTab userId={userId} />}
      {tab === 'profile' && <ProfileTab userId={userName} />}
    </div>
  );
}

function ReportTab({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
  const [step, setStep] = useState(1);
  const [image, setImage] = useState('');
  const [damageType, setDamageType] = useState<DamageType>(DamageType.POTHOLE);
  const [severity, setSeverity] = useState(5);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setGps({ lat: 40.7128, lng: -74.006 })
      );
    }
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      setImage(data.url);
      toast.success('Image uploaded');
    } catch {
      toast.error('Upload failed');
    }
  };

  const handleSubmit = async () => {
    if (!image || !gps) {
      toast.error('Please add a photo');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: image,
          lat: gps.lat,
          lng: gps.lng,
          damageType,
          severity,
          description,
          address,
          isAnonymous,
          deviceId: userId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.merged ? 'Added to existing report!' : 'Report submitted!');
        setStep(3);
        onSuccess();
      } else {
        toast.error(data.error || 'Failed to submit');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 3) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2">Report Submitted!</h2>
        <p className="text-zinc-400 mb-6">Track your report status in the Tracker tab.</p>
        <button
          onClick={() => { setStep(1); setImage(''); setDescription(''); }}
          className="px-6 py-3 rounded-lg bg-white text-black font-semibold"
        >
          Submit Another Report
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {step === 1 && (
        <div className="space-y-4 animate-in">
          <div className="p-8 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 text-center">
            {image ? (
              <div className="relative">
                <div className="max-h-64 mx-auto rounded-xl bg-zinc-800 flex items-center justify-center p-8">
                  <div className="text-center text-zinc-400">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21,15 16,10 10,15" />
                    </svg>
                    <p className="text-sm">Photo selected</p>
                  </div>
                </div>
                <button
                  onClick={() => setImage('')}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <div className="text-4xl mb-3">📸</div>
                <p className="text-zinc-400 mb-4">Take a photo or upload an image</p>
                <label className="inline-flex px-6 py-3 rounded-lg bg-white text-black font-semibold cursor-pointer hover:bg-zinc-200 transition-colors">
                  Choose Photo
                  <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                </label>
              </>
            )}
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={!image}
            className="w-full py-3 rounded-lg bg-white text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-in">
          <div>
            <label className="block text-sm font-medium mb-2">Damage Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(DAMAGE_TYPE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setDamageType(key as DamageType)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    damageType === key
                      ? 'border-white bg-white/10 text-white'
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Severity: <span className="text-white">{severity}/10</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={severity}
              onChange={e => setSeverity(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-zinc-500 mt-1">
              <span>Minor</span>
              <span>Critical</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description (optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-white resize-none"
              placeholder="Describe the issue..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Address (optional)</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="Near..."
            />
          </div>

          <label className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={e => setIsAnonymous(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Report anonymously</span>
          </label>

          {gps && (
            <div className="p-3 rounded-lg bg-zinc-800/50 text-xs text-zinc-400">
              📍 GPS: {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-lg bg-zinc-800 font-medium"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 rounded-lg bg-white text-black font-semibold disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TrackerTab({ reports, loading }: { reports: Report[]; loading: boolean }) {
  if (loading) {
    return <div className="text-center py-12 text-zinc-500">Loading reports...</div>;
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📋</div>
        <h3 className="text-xl font-bold mb-2">No Reports Yet</h3>
        <p className="text-zinc-400">Submit your first report to start tracking.</p>
      </div>
    );
  }

  const statusOrder = [ReportStatus.ACTIVE, ReportStatus.VERIFIED, ReportStatus.IN_PROGRESS, ReportStatus.RESOLVED];

  return (
    <div className="space-y-4">
      {reports.map(report => (
        <div key={report.id} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-start gap-3 mb-3">
            {report.imageUrl ? (
              <img src={report.imageUrl} alt="Report" className="w-16 h-16 rounded-lg object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-600">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21,15 16,10 10,15" />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">{DAMAGE_TYPE_LABELS[report.damageType]}</span>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: REPORT_STATUS_COLORS[report.status] + '20', color: REPORT_STATUS_COLORS[report.status] }}
                >
                  {REPORT_STATUS_LABELS[report.status]}
                </span>
              </div>
              {report.description && <p className="text-xs text-zinc-400 truncate">{report.description}</p>}
              <p className="text-xs text-zinc-500 mt-1">
                {new Date(report.createdAt).toLocaleDateString()} • Priority {report.priority}/10
              </p>
            </div>
          </div>

          <div className="flex gap-1">
            {statusOrder.map((status, i) => {
              const currentIdx = statusOrder.indexOf(report.status);
              const isComplete = i <= currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={status} className="flex-1">
                  <div className={`h-1.5 rounded-full ${isComplete ? 'bg-white' : 'bg-zinc-800'}`} />
                  <p className={`text-[10px] mt-1 text-center ${isCurrent ? 'text-white' : 'text-zinc-600'}`}>
                    {REPORT_STATUS_LABELS[status].split(' ')[0]}
                  </p>
                </div>
              );
            })}
          </div>

          {report.upvotes && report.upvotes.length > 1 && (
            <p className="text-xs text-zinc-500 mt-2">👍 {report.upvotes.length} people confirmed this issue</p>
          )}
        </div>
      ))}
    </div>
  );
}

function FeedTab({ userId }: { userId: string }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports?limit=50')
      .then(res => res.json())
      .then(data => {
        setReports(data.reports || []);
        setLoading(false);
      });
  }, []);

  const handleUpvote = async (report: Report) => {
    try {
      await fetch('/api/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: report.id,
          verificationCount: report.verificationCount + 1,
          upvotes: [...(report.upvotes || []), userId],
          priority: Math.min(10, report.priority + 1),
        }),
      });
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, verificationCount: r.verificationCount + 1, upvotes: [...(r.upvotes || []), userId] } : r));
      toast.success('Upvoted!');
    } catch {
      toast.error('Failed to upvote');
    }
  };

  if (loading) return <div className="text-center py-12 text-zinc-500">Loading community feed...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold mb-4">Community Reports Nearby</h3>
      {reports.map(report => (
        <div key={report.id} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-start gap-3">
            {report.imageUrl ? (
              <img src={report.imageUrl} alt="Report" className="w-20 h-20 rounded-lg object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-600">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21,15 16,10 10,15" />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">{DAMAGE_TYPE_LABELS[report.damageType]}</span>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: REPORT_STATUS_COLORS[report.status] + '20', color: REPORT_STATUS_COLORS[report.status] }}
                >
                  {REPORT_STATUS_LABELS[report.status]}
                </span>
              </div>
              {report.description && <p className="text-xs text-zinc-400 line-clamp-2">{report.description}</p>}
              <p className="text-xs text-zinc-500 mt-1">
                {new Date(report.createdAt).toLocaleDateString()} • 👍 {report.upvotes?.length || 0}
              </p>
            </div>
          </div>
          {!report.upvotes?.includes(userId) && report.status !== ReportStatus.RESOLVED && (
            <button
              onClick={() => handleUpvote(report)}
              className="mt-3 w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium transition-colors"
            >
              👍 Confirm This Issue
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function ProfileTab({ userId }: { userId: string }) {
  const [gamification, setGamification] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/gamification')
      .then(res => res.json())
      .then(data => {
        setGamification(data.record);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-12 text-zinc-500">Loading profile...</div>;

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
        <div className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center text-2xl font-bold mx-auto mb-4">
          {userId.charAt(0).toUpperCase()}
        </div>
        <h3 className="text-xl font-bold">{userId}</h3>
        <p className="text-zinc-400 text-sm">Citizen Reporter</p>
      </div>

      {gamification && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
          <h4 className="font-bold mb-4">Achievements</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-xl bg-zinc-800/50">
              <div className="text-2xl font-bold text-yellow-400">{gamification.points}</div>
              <div className="text-xs text-zinc-400 mt-1">Total Points</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-zinc-800/50">
              <div className="text-2xl font-bold text-blue-400">{gamification.reportsSubmitted}</div>
              <div className="text-xs text-zinc-400 mt-1">Reports Filed</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-zinc-800/50">
              <div className="text-2xl font-bold text-green-400">{gamification.reportsResolved}</div>
              <div className="text-xs text-zinc-400 mt-1">Issues Resolved</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-zinc-800/50">
              <div className="text-2xl font-bold text-purple-400">{gamification.rank}</div>
              <div className="text-xs text-zinc-400 mt-1">Current Rank</div>
            </div>
          </div>

          {gamification.leaderboardPosition && (
            <div className="mt-4 p-4 rounded-xl bg-zinc-800/50 text-center">
              <div className="text-lg font-bold">🏆 #{gamification.leaderboardPosition} on Leaderboard</div>
            </div>
          )}

          {gamification.badges && gamification.badges.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-medium mb-2">Badges Earned</h5>
              <div className="flex flex-wrap gap-2">
                {gamification.badges.map((badge: string, i: number) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-zinc-800 text-xs font-medium">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
