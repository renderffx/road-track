'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Report, ReportStatus, DAMAGE_TYPE_LABELS, REPORT_STATUS_LABELS } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import toast from 'react-hot-toast';
import { formatRelativeTime, formatCoordinates } from '@/lib/utils';
import { useAnalytics, getStatusChartData, getTypeChartData, getPerformanceScore, getScoreGrade, formatResolutionTime } from '@/lib/analytics';

type View = 'overview' | 'reports' | 'dispatch' | 'budget' | 'announcements';
type SortBy = 'newest' | 'oldest' | 'priority' | 'severity';
type StatusFilter = 'all' | ReportStatus;

const statusConfig: Record<StatusFilter, { label: string; dot: string }> = {
  all: { label: 'All', dot: 'bg-zinc-500' },
  [ReportStatus.ACTIVE]: { label: 'Pending', dot: 'bg-orange-500' },
  [ReportStatus.VERIFIED]: { label: 'Verified', dot: 'bg-blue-500' },
  [ReportStatus.IN_PROGRESS]: { label: 'In Progress', dot: 'bg-yellow-500' },
  [ReportStatus.RESOLVED]: { label: 'Resolved', dot: 'bg-green-500' },
  [ReportStatus.GHOST]: { label: 'Unverified', dot: 'bg-zinc-400' },
};

export default function AdminPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
      } else if (user.role !== 'admin') {
        router.push('/');
      }
    }
  }, [user, authLoading, router]);

  const [reports, setReports] = useState<Report[]>([]);
  const [selected, setSelected] = useState<Report | null>(null);
  const [view, setView] = useState<View>('overview');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [updating, setUpdating] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [budget, setBudget] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [gamification, setGamification] = useState<any>(null);
  const [showAnnounceForm, setShowAnnounceForm] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceContent, setAnnounceContent] = useState('');
  const [announceType, setAnnounceType] = useState('blast');
  const [announceNeighborhood, setAnnounceNeighborhood] = useState('');

  const fetchReports = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (data.reports) setReports(data.reports);
    } catch (e) {
      console.error('Failed to fetch:', e);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    const interval = setInterval(() => fetchReports(false), 5000);
    return () => clearInterval(interval);
  }, [fetchReports]);

  useEffect(() => {
    if (view === 'budget') {
      fetch('/api/budget')
        .then(res => res.json())
        .then(data => setBudget(data.budget || []));
    }
    if (view === 'announcements') {
      fetch('/api/announcements')
        .then(res => res.json())
        .then(data => setAnnouncements(data.announcements || []));
    }
    if (view === 'dispatch') {
      fetch('/api/reports?limit=100')
        .then(res => res.json())
        .then(data => setReports(data.reports || []));
    }
  }, [view]);

  useEffect(() => {
    if (view === 'overview') {
      fetch('/api/predictions')
        .then(res => res.json())
        .then(data => setPredictions(data.predictions || []));
      fetch('/api/gamification')
        .then(res => res.json())
        .then(data => setGamification(data));
    }
  }, [view]);

  const updateStatus = async (id: string, status: ReportStatus) => {
    setUpdating(id);
    try {
      const res = await fetch('/api/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const result = await res.json();
      if (result.success) {
        setReports(prev => prev.map(r => r.id === id ? result.report : r));
        setSelected(result.report);
        toast.success(`Marked as ${statusConfig[status]?.label || status}`);
      }
    } catch {
      toast.error('Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const deleteReport = async (id: string) => {
    if (!confirm('Delete this report?')) return;
    try {
      const res = await fetch(`/api/reports?id=${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        setReports(prev => prev.filter(r => r.id !== id));
        if (selected?.id === id) setSelected(null);
        toast.success('Report deleted');
      }
    } catch {
      toast.error('Delete failed');
    }
  };

  const autoDispatch = async (reportId: string) => {
    try {
      const res = await fetch('/api/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reportId,
          assignedTo: 'worker-001',
          assignedAt: Date.now(),
          status: ReportStatus.IN_PROGRESS,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReports(prev => prev.map(r => r.id === reportId ? data.report : r));
        toast.success('Dispatched to nearest worker');
      }
    } catch {
      toast.error('Dispatch failed');
    }
  };

  const createAnnouncement = async () => {
    if (!announceTitle || !announceContent) {
      toast.error('Title and content required');
      return;
    }
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: announceTitle, content: announceContent, type: announceType, neighborhood: announceNeighborhood }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Announcement sent');
        setShowAnnounceForm(false);
        setAnnounceTitle('');
        setAnnounceContent('');
        setAnnouncements(prev => [data.announcement, ...prev]);
      }
    } catch {
      toast.error('Failed to send announcement');
    }
  };

  const filteredReports = useMemo(() => {
    let filtered = [...reports];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(r =>
        DAMAGE_TYPE_LABELS[r.damageType].toLowerCase().includes(q) ||
        r.address?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    switch (sortBy) {
      case 'newest': filtered.sort((a, b) => b.createdAt - a.createdAt); break;
      case 'oldest': filtered.sort((a, b) => a.createdAt - b.createdAt); break;
      case 'priority': filtered.sort((a, b) => b.priority - a.priority); break;
      case 'severity': filtered.sort((a, b) => b.severity - a.severity); break;
    }
    return filtered;
  }, [reports, search, statusFilter, sortBy]);

  const stats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter(r => r.status === ReportStatus.ACTIVE).length,
    verified: reports.filter(r => r.status === ReportStatus.VERIFIED).length,
    inProgress: reports.filter(r => r.status === ReportStatus.IN_PROGRESS).length,
    resolved: reports.filter(r => r.status === ReportStatus.RESOLVED).length,
    critical: reports.filter(r => r.priority >= 8).length,
    unassigned: reports.filter(r => (r.status === ReportStatus.ACTIVE || r.status === ReportStatus.VERIFIED) && !r.assignedTo).length,
    slaBreached: reports.filter(r => r.slaBreached || (r.slaDeadline && r.slaDeadline < Date.now() && r.status !== ReportStatus.RESOLVED)).length,
    fraudFlagged: reports.filter(r => r.fraudFlag).length,
  }), [reports]);

  const analytics = useAnalytics(reports);
  const performanceScore = getPerformanceScore(analytics);
  const scoreGrade = getScoreGrade(performanceScore);
  const statusChartData = getStatusChartData(analytics.reportsByStatus);
  const typeChartData = getTypeChartData(analytics.reportsByType);

  const unassigned = reports.filter((r: Report) => (r.status === ReportStatus.ACTIVE || r.status === ReportStatus.VERIFIED) && !r.assignedTo).sort((a: Report, b: Report) => b.priority - a.priority);
  const inProgress = reports.filter((r: Report) => r.status === ReportStatus.IN_PROGRESS);
  const totalAllocated = budget.reduce((sum: number, b: any) => sum + b.allocated, 0);
  const totalSpent = budget.reduce((sum: number, b: any) => sum + b.spent, 0);
  const budgetRemaining = totalAllocated - totalSpent;

  if (loading || authLoading) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl bg-black dark:bg-white flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white dark:text-black animate-pulse">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <p className="text-sm text-zinc-500">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  const tabs: { key: View; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'reports', label: 'Reports' },
    { key: 'dispatch', label: 'Dispatch' },
    { key: 'budget', label: 'Budget' },
    { key: 'announcements', label: 'Announcements' },
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-all active:scale-95">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-600 dark:text-zinc-400">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-xs text-zinc-500">{stats.total} reports</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-sm font-medium mr-2">{user.name}</span>
              <button
                onClick={() => fetchReports(true)}
                disabled={refreshing}
                className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-zinc-600 dark:text-zinc-400 ${refreshing ? 'animate-spin' : ''}`}>
                  <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </button>
              <button onClick={logout} className="px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 text-sm font-medium transition-colors">
                Logout
              </button>
            </div>
          </div>

          <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 mt-4">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => { setView(tab.key); setSelected(null); setSearch(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  view === tab.key ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {/* OVERVIEW */}
        {view === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Total', value: stats.total, color: 'text-zinc-900 dark:text-zinc-100' },
                { label: 'Pending', value: stats.pending, color: 'text-orange-600' },
                { label: 'Active', value: stats.inProgress, color: 'text-yellow-600' },
                { label: 'Resolved', value: stats.resolved, color: 'text-green-600' },
                { label: 'Critical', value: stats.critical, color: 'text-red-600' },
                { label: 'SLA', value: stats.slaBreached, color: 'text-red-600' },
                { label: 'Fraud', value: stats.fraudFlagged, color: 'text-purple-600' },
                { label: 'Unassigned', value: stats.unassigned, color: 'text-zinc-600 dark:text-zinc-400' },
              ].map(stat => (
                <div key={stat.label} className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800 text-center">
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Performance Score */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-sm">Performance Score</h2>
                <span className="text-xs text-zinc-500">Last 30 days</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="relative w-20 h-20 shrink-0">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--muted)" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={scoreGrade.color} strokeWidth="3" strokeDasharray={`${performanceScore}, 100`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold" style={{ color: scoreGrade.color }}>{performanceScore}</span>
                    <span className="text-[9px] text-zinc-500">{scoreGrade.grade}</span>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-2.5">
                    <p className="text-[10px] text-zinc-500 uppercase">Rating</p>
                    <p className="text-xs font-bold" style={{ color: scoreGrade.color }}>{scoreGrade.description}</p>
                  </div>
                  <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-2.5">
                    <p className="text-[10px] text-zinc-500 uppercase">Avg Resolution</p>
                    <p className="text-xs font-bold">{analytics.avgResolutionTime > 0 ? formatResolutionTime(analytics.avgResolutionTime) : 'N/A'}</p>
                  </div>
                  <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-2.5">
                    <p className="text-[10px] text-zinc-500 uppercase">Trend</p>
                    <p className="text-xs font-bold">{analytics.trendDirection === 'up' ? 'Increasing' : analytics.trendDirection === 'down' ? 'Decreasing' : 'Stable'}</p>
                  </div>
                  <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-2.5">
                    <p className="text-[10px] text-zinc-500 uppercase">Verification</p>
                    <p className="text-xs font-bold">{analytics.verificationRate.toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-bold text-xs mb-3">By Status</h3>
                <div className="space-y-2">
                  {statusChartData.labels.map((label: string, i: number) => {
                    const value = statusChartData.values[i];
                    const max = Math.max(...statusChartData.values, 1);
                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between text-[10px] mb-0.5">
                          <span className="text-zinc-500">{label}</span>
                          <span className="font-bold">{value}</span>
                        </div>
                        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${(value / max) * 100}%`, backgroundColor: statusChartData.colors[i] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-bold text-xs mb-3">By Type</h3>
                <div className="space-y-2">
                  {typeChartData.labels.map((label: string, i: number) => {
                    const value = typeChartData.values[i];
                    const max = Math.max(...typeChartData.values, 1);
                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between text-[10px] mb-0.5">
                          <span className="text-zinc-500">{label}</span>
                          <span className="font-bold">{value}</span>
                        </div>
                        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${(value / max) * 100}%`, backgroundColor: typeChartData.colors[i] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Daily Activity */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-xs mb-3">Daily Activity (30 Days)</h3>
              <div className="flex items-end gap-0.5 h-24">
                {analytics.reportsByDay.map((day: any) => {
                  const maxCount = Math.max(...analytics.reportsByDay.map((d: any) => d.count), 1);
                  return (
                    <div
                      key={day.date}
                      className="flex-1 bg-zinc-200 dark:bg-zinc-700 rounded-t-sm hover:bg-black dark:hover:bg-white transition-colors relative group"
                      style={{ height: `${Math.max((day.count / maxCount) * 100, 2)}%` }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-black dark:bg-white text-white dark:text-black text-[9px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {day.count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Insights */}
            {predictions.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-bold text-xs mb-3">Predictive Insights</h3>
                <div className="space-y-2">
                  {predictions.slice(0, 3).map((pred: any) => (
                    <div key={pred.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                      <div>
                        <p className="text-xs font-medium">{DAMAGE_TYPE_LABELS[pred.damageType] || pred.damageType}</p>
                        <p className="text-[10px] text-zinc-500">{pred.neighborhood}</p>
                      </div>
                      <span className={`text-xs font-bold ${pred.probability > 0.7 ? 'text-red-500' : pred.probability > 0.5 ? 'text-yellow-500' : 'text-green-500'}`}>
                        {(pred.probability * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Leaderboard */}
            {gamification && gamification.leaderboard && gamification.leaderboard.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-bold text-xs mb-3">Top Citizens</h3>
                <div className="space-y-1.5">
                  {gamification.leaderboard.slice(0, 5).map((record: any, i: number) => (
                    <div key={record.userId} className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-400 w-4">#{i + 1}</span>
                        <span className="text-xs font-medium">{record.rank}</span>
                      </div>
                      <span className="text-xs font-bold">{record.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* REPORTS */}
        {view === 'reports' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="relative">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search reports..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {(['all', ReportStatus.ACTIVE, ReportStatus.VERIFIED, ReportStatus.IN_PROGRESS, ReportStatus.RESOLVED] as StatusFilter[]).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    statusFilter === status
                      ? 'bg-black dark:bg-white text-white dark:text-black'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[status].dot}`} />
                  {statusConfig[status].label}
                  <span className="opacity-60">{status === 'all' ? stats.total : reports.filter(r => r.status === status).length}</span>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredReports.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 text-center border border-zinc-200 dark:border-zinc-800">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">No reports found</p>
                  <p className="text-xs text-zinc-500 mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                filteredReports.map(report => (
                  <div
                    key={report.id}
                    onClick={() => setSelected(selected?.id === report.id ? null : report)}
                    className={`group bg-white dark:bg-zinc-900 rounded-2xl p-4 cursor-pointer transition-all border ${
                      selected?.id === report.id
                        ? 'border-black dark:border-white shadow-lg'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center shrink-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21,15 16,10 10,15" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{DAMAGE_TYPE_LABELS[report.damageType]}</h3>
                          <StatusBadge status={report.status} />
                        </div>
                        <p className="text-[11px] text-zinc-500 font-mono">{formatCoordinates(report.lat, report.lng)}</p>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-1">
                          <span>{formatRelativeTime(report.createdAt)}</span>
                          <span className={`px-1.5 py-0.5 rounded font-medium ${
                            report.priority >= 8 ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                            report.priority >= 5 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600' :
                            'bg-green-100 dark:bg-green-900/30 text-green-600'
                          }`}>P{report.priority}</span>
                          <span>{report.verificationCount}x</span>
                        </div>
                      </div>
                    </div>

                    {selected?.id === report.id && (
                      <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                        {report.description && (
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">{report.description}</p>
                        )}
                        {report.address && (
                          <p className="text-xs text-zinc-500">{report.address}</p>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          {report.status !== ReportStatus.IN_PROGRESS && (
                            <button
                              onClick={() => updateStatus(report.id, ReportStatus.IN_PROGRESS)}
                              disabled={updating === report.id}
                              className="py-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 text-xs font-medium hover:bg-yellow-100 dark:hover:bg-yellow-950/40 disabled:opacity-40"
                            >
                              In Progress
                            </button>
                          )}
                          {report.status !== ReportStatus.RESOLVED && (
                            <button
                              onClick={() => updateStatus(report.id, ReportStatus.RESOLVED)}
                              disabled={updating === report.id}
                              className="py-2 rounded-lg bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-xs font-medium hover:bg-green-100 dark:hover:bg-green-950/40 disabled:opacity-40"
                            >
                              Resolve
                            </button>
                          )}
                          <button
                            onClick={() => deleteReport(report.id)}
                            disabled={updating === report.id}
                            className="py-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-950/40 disabled:opacity-40 col-span-2"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* DISPATCH */}
        {view === 'dispatch' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800 text-center">
                <p className="text-lg font-bold text-orange-600">{unassigned.length}</p>
                <p className="text-[10px] text-zinc-500 uppercase">Unassigned</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800 text-center">
                <p className="text-lg font-bold text-yellow-600">{inProgress.length}</p>
                <p className="text-[10px] text-zinc-500 uppercase">In Progress</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800 text-center">
                <p className="text-lg font-bold text-green-600">1</p>
                <p className="text-[10px] text-zinc-500 uppercase">Workers</p>
              </div>
            </div>

            {unassigned.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 text-center border border-zinc-200 dark:border-zinc-800">
                <p className="text-sm font-medium">All reports assigned</p>
              </div>
            ) : (
              <div className="space-y-3">
                {unassigned.map(report => (
                  <div key={report.id} className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21,15 16,10 10,15" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{DAMAGE_TYPE_LABELS[report.damageType]}</p>
                        <p className="text-xs text-zinc-500">Priority {report.priority}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => autoDispatch(report.id)}
                      className="px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90"
                    >
                      Dispatch
                    </button>
                  </div>
                ))}
              </div>
            )}

            {inProgress.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold">In Progress</h3>
                {inProgress.map(report => (
                  <div key={report.id} className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{DAMAGE_TYPE_LABELS[report.damageType]}</p>
                      <p className="text-xs text-zinc-500">Assigned to worker-001</p>
                    </div>
                    <button
                      onClick={() => updateStatus(report.id, ReportStatus.RESOLVED)}
                      className="px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-500"
                    >
                      Resolve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BUDGET */}
        {view === 'budget' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800 text-center">
                <p className="text-lg font-bold">${totalAllocated.toLocaleString()}</p>
                <p className="text-[10px] text-zinc-500 uppercase">Allocated</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800 text-center">
                <p className="text-lg font-bold text-orange-600">${totalSpent.toLocaleString()}</p>
                <p className="text-[10px] text-zinc-500 uppercase">Spent</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800 text-center">
                <p className="text-lg font-bold text-green-600">${budgetRemaining.toLocaleString()}</p>
                <p className="text-[10px] text-zinc-500 uppercase">Remaining</p>
              </div>
            </div>

            {budget.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 text-center border border-zinc-200 dark:border-zinc-800">
                <p className="text-sm font-medium">No budget data</p>
              </div>
            ) : (
              <div className="space-y-3">
                {budget.map(entry => {
                  const pct = entry.allocated > 0 ? (entry.spent / entry.allocated) * 100 : 0;
                  return (
                    <div key={entry.id} className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{entry.category}</span>
                        <span className="text-xs text-zinc-500">${entry.spent.toLocaleString()} / ${entry.allocated.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1">{pct.toFixed(1)}% used</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ANNOUNCEMENTS */}
        {view === 'announcements' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <button
              onClick={() => setShowAnnounceForm(!showAnnounceForm)}
              className="w-full py-2.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-sm font-semibold hover:opacity-90"
            >
              {showAnnounceForm ? 'Cancel' : 'New Announcement'}
            </button>

            {showAnnounceForm && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <input
                  type="text"
                  value={announceTitle}
                  onChange={e => setAnnounceTitle(e.target.value)}
                  placeholder="Title"
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
                <textarea
                  value={announceContent}
                  onChange={e => setAnnounceContent(e.target.value)}
                  placeholder="Content"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
                />
                <div className="flex gap-2">
                  <select value={announceType} onChange={e => setAnnounceType(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm">
                    <option value="blast">City-wide</option>
                    <option value="neighborhood">Neighborhood</option>
                    <option value="system">System</option>
                  </select>
                  {announceType === 'neighborhood' && (
                    <input
                      type="text"
                      value={announceNeighborhood}
                      onChange={e => setAnnounceNeighborhood(e.target.value)}
                      placeholder="Area"
                      className="flex-1 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
                    />
                  )}
                </div>
                <button onClick={createAnnouncement} className="w-full py-2.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-sm font-semibold">
                  Send
                </button>
              </div>
            )}

            {announcements.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 text-center border border-zinc-200 dark:border-zinc-800">
                <p className="text-sm font-medium">No announcements</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map(a => (
                  <div key={a.id} className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm">{a.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        a.type === 'blast' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                        a.type === 'neighborhood' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                        'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {a.type}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">{a.content}</p>
                    <p className="text-[10px] text-zinc-400 mt-2">{new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
