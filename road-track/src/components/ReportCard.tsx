'use client';

import { memo } from 'react';
import { Report, DAMAGE_TYPE_LABELS } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import StatusBadge from './StatusBadge';

interface ReportCardProps {
  report: Report;
  onClick?: () => void;
  isSelected?: boolean;
}

const typeColors: Record<string, string> = {
  pothole: 'from-red-500 to-red-600',
  crack: 'from-orange-500 to-orange-600',
  sinkhole: 'from-rose-500 to-rose-600',
  road: 'from-zinc-500 to-zinc-600',
  light: 'from-amber-500 to-amber-600',
  drainage: 'from-blue-500 to-blue-600',
  other: 'from-zinc-400 to-zinc-500',
};

function ReportCardComponent({ report, onClick, isSelected }: ReportCardProps) {
  const gradient = typeColors[report.damageType] || typeColors.other;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={`
        bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 
        cursor-pointer transition-all duration-200 select-none
        hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0
        ${isSelected ? 'ring-2 ring-black dark:ring-white shadow-lg' : ''}
      `}
    >
      <div className={`relative aspect-[4/3] bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <div className="text-center text-white">
          <div className="text-3xl font-bold mb-1">{DAMAGE_TYPE_LABELS[report.damageType]}</div>
          <div className="text-xs opacity-70">Report #{report.id.slice(-6)}</div>
        </div>
        <div className="absolute top-3 right-3">
          <StatusBadge status={report.status} />
        </div>
        {report.priority >= 8 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
            CRITICAL
          </div>
        )}
      </div>
      
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold">{DAMAGE_TYPE_LABELS[report.damageType]}</h3>
          <span className={`
            text-sm font-bold shrink-0
            ${report.priority >= 8 ? 'text-red-600' : 
              report.priority >= 5 ? 'text-yellow-600' : 
              'text-zinc-400'}
          `}>
            P{report.priority}
          </span>
        </div>
        
        {report.description && (
          <p className="text-sm text-zinc-500 line-clamp-2">{report.description}</p>
        )}
        
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span>{formatRelativeTime(report.createdAt)}</span>
          <span>{report.verificationCount} verified</span>
        </div>
      </div>
    </div>
  );
}

export default memo(ReportCardComponent);
