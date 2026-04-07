'use client';

import { ReportStatus, REPORT_STATUS_LABELS, REPORT_STATUS_COLORS } from '@/types';

interface StatusBadgeProps {
  status: ReportStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const color = REPORT_STATUS_COLORS[status];
  const label = REPORT_STATUS_LABELS[status];
  
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm"
      style={{ 
        backgroundColor: `${color}20`,
        color: color,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
