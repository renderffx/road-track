'use client';

import { useState, useEffect } from 'react';
import { Report, ReportStatus, DAMAGE_TYPE_LABELS, REPORT_STATUS_LABELS } from '@/types';
import Link from 'next/link';

export default function TransparencyPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports?limit=1000')
      .then(res => res.json())
      .then(data => {
        setReports(data.reports || []);
        setLoading(false);
      });

    const interval = setInterval(() => {
      fetch('/api/reports?limit=1000')
        .then(res => res.json())
        .then(data => setReports(data.reports || []));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const totalReports = reports.length;
  const resolved = reports.filter(r => r.status === ReportStatus.RESOLVED).length;
  const inProgress = reports.filter(r => r.status === ReportStatus.IN_PROGRESS).length;
  const pending = reports.filter(r => r.status === ReportStatus.ACTIVE || r.status === ReportStatus.VERIFIED).length;
  const resolvedThisMonth = reports.filter(r => r.status === ReportStatus.RESOLVED && r.resolvedAt && new Date(r.resolvedAt).getMonth() === new Date().getMonth()).length;
  const avgResolutionTime = (() => {
    const resolvedReports = reports.filter(r => r.resolvedAt);
    if (resolvedReports.length === 0) return 0;
    const total = resolvedReports.reduce((sum, r) => sum + (r.resolvedAt! - r.createdAt), 0);
    return total / resolvedReports.length / (1000 * 60 * 60);
  })();

  const byType = Object.values(DAMAGE_TYPE_LABELS).map(label => {
    const type = Object.entries(DAMAGE_TYPE_LABELS).find(([, l]) => l === label)?.[0] as string;
    const count = reports.filter(r => DAMAGE_TYPE_LABELS[r.damageType] === label).length;
    const resolvedCount = reports.filter(r => DAMAGE_TYPE_LABELS[r.damageType] === label && r.status === ReportStatus.RESOLVED).length;
    return { label, count, resolvedCount };
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-pulse text-white text-lg">Loading transparency data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <span className="text-xl font-bold">RoadTrack</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">Home</Link>
            <Link href="/citizen" className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors">
              Report Issue
            </Link>
          </div>
        </div>
      </nav>

      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Public Transparency Portal</h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Real-time data on infrastructure repairs. Full transparency, full accountability.
          </p>
        </div>
      </section>

      <section className="py-12 px-6 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 text-center">
              <p className="text-4xl font-bold text-white">{totalReports}</p>
              <p className="text-sm text-zinc-400 mt-2">Total Reports</p>
            </div>
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 text-center">
              <p className="text-4xl font-bold text-green-400">{resolved}</p>
              <p className="text-sm text-zinc-400 mt-2">Total Fixed</p>
            </div>
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 text-center">
              <p className="text-4xl font-bold text-yellow-400">{resolvedThisMonth}</p>
              <p className="text-sm text-zinc-400 mt-2">Fixed This Month</p>
            </div>
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 text-center">
              <p className="text-4xl font-bold text-blue-400">
                {avgResolutionTime > 0 ? `${Math.round(avgResolutionTime)}h` : 'N/A'}
              </p>
              <p className="text-sm text-zinc-400 mt-2">Avg Resolution</p>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-8">
            <h3 className="font-bold text-lg mb-6">Resolution Rate</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-4 bg-zinc-800 rounded-full overflow-hidden flex">
                {totalReports > 0 && (
                  <>
                    <div className="bg-green-500 transition-all" style={{ width: `${(resolved / totalReports) * 100}%` }} />
                    <div className="bg-yellow-500 transition-all" style={{ width: `${(inProgress / totalReports) * 100}%` }} />
                    <div className="bg-orange-500 transition-all" style={{ width: `${(pending / totalReports) * 100}%` }} />
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-zinc-400">Resolved ({totalReports > 0 ? ((resolved / totalReports) * 100).toFixed(1) : 0}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-zinc-400">In Progress ({totalReports > 0 ? ((inProgress / totalReports) * 100).toFixed(1) : 0}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-zinc-400">Pending ({totalReports > 0 ? ((pending / totalReports) * 100).toFixed(1) : 0}%)</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h3 className="font-bold text-lg mb-4">Reports by Type</h3>
              <div className="space-y-3">
                {byType.filter(t => t.count > 0).map(t => (
                  <div key={t.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-zinc-400">{t.label}</span>
                      <span className="font-bold">{t.count} ({t.resolvedCount} fixed)</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full transition-all" style={{ width: `${t.count > 0 ? (t.resolvedCount / t.count) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h3 className="font-bold text-lg mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {reports.slice(0, 8).map(report => (
                  <div key={report.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors">
                    <span className={`w-2 h-2 rounded-full ${
                      report.status === ReportStatus.RESOLVED ? 'bg-green-400' :
                      report.status === ReportStatus.IN_PROGRESS ? 'bg-yellow-400' :
                      'bg-orange-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{DAMAGE_TYPE_LABELS[report.damageType]}</p>
                      <p className="text-xs text-zinc-500">{new Date(report.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs text-zinc-400">{REPORT_STATUS_LABELS[report.status]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 border-t border-zinc-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">See an Issue? Report It.</h2>
          <p className="text-zinc-400 mb-8">Every report makes our city better. It takes less than 30 seconds.</p>
          <Link href="/citizen" className="inline-flex px-8 py-4 rounded-xl bg-white text-black font-bold text-lg hover:bg-zinc-200 transition-colors">
            Start Reporting
          </Link>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-zinc-500">
          <span>RoadTrack Transparency Portal</span>
          <span>Data updates in real-time</span>
        </div>
      </footer>
    </div>
  );
}
