'use client';

import { useMemo } from 'react';
import { useStore } from '@/store';
import ReportCard from './ReportCard';

export default function ReportList() {
  const { reports, selectReport, selectedReportId } = useStore();

  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => b.createdAt - a.createdAt);
  }, [reports]);

  if (reports.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-5">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">No Reports Yet</h2>
        <p className="text-zinc-500 mb-6">Be the first to report an issue</p>
        <button
          onClick={() => useStore.setState({ mode: 'report' })}
          className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-medium rounded-xl hover:opacity-90 transition-opacity"
        >
          Submit Report
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold">My Reports</h2>
        <span className="text-sm text-zinc-500">{reports.length} total</span>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2">
        {sortedReports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            onClick={() => selectReport(report.id)}
            isSelected={selectedReportId === report.id}
          />
        ))}
      </div>
    </div>
  );
}
