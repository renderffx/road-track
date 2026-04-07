'use client';

import { useMemo } from 'react';
import { Report, ReportStatus, DamageType, DAMAGE_TYPE_LABELS } from '@/types';

export interface AnalyticsData {
  totalReports: number;
  reportsByStatus: Record<ReportStatus, number>;
  reportsByType: Record<DamageType, number>;
  reportsByDay: { date: string; count: number }[];
  avgResolutionTime: number;
  criticalCount: number;
  verificationRate: number;
  heatmapData: HeatmapPoint[];
  trendDirection: 'up' | 'down' | 'stable';
  monthlyGrowth: number;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
  radius: number;
  type: DamageType;
}

export interface ChartData {
  labels: string[];
  values: number[];
  colors: string[];
}

const STATUS_COLORS: Record<ReportStatus, string> = {
  [ReportStatus.GHOST]: '#9CA3AF',
  [ReportStatus.ACTIVE]: '#F97316',
  [ReportStatus.VERIFIED]: '#3B82F6',
  [ReportStatus.IN_PROGRESS]: '#EAB308',
  [ReportStatus.RESOLVED]: '#22C55E',
};

const TYPE_COLORS: Record<DamageType, string> = {
  [DamageType.POTHOLE]: '#EF4444',
  [DamageType.CRACK]: '#F97316',
  [DamageType.SINKHOLE]: '#DC2626',
  [DamageType.ROAD]: '#6B7280',
  [DamageType.LIGHT]: '#FBBF24',
  [DamageType.DRAINAGE]: '#3B82F6',
  [DamageType.OTHER]: '#9CA3AF',
};

export function calculateAnalytics(reports: Report[], daysBack: number = 30): AnalyticsData {
  const now = Date.now();
  const cutoffTime = now - daysBack * 24 * 60 * 60 * 1000;
  
  const filteredReports = reports.filter(r => r.createdAt >= cutoffTime);
  
  const reportsByStatus = Object.values(ReportStatus).reduce((acc, status) => {
    acc[status] = reports.filter(r => r.status === status).length;
    return acc;
  }, {} as Record<ReportStatus, number>);

  const reportsByType = Object.values(DamageType).reduce((acc, type) => {
    acc[type] = reports.filter(r => r.damageType === type).length;
    return acc;
  }, {} as Record<DamageType, number>);

  const reportsByDay: { date: string; count: number }[] = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const count = reports.filter(r => {
      const reportDate = new Date(r.createdAt).toISOString().split('T')[0];
      return reportDate === dateStr;
    }).length;
    reportsByDay.push({ date: dateStr, count });
  }

  const resolvedReports = reports.filter(r => r.resolvedAt && r.status === ReportStatus.RESOLVED);
  const avgResolutionTime = resolvedReports.length > 0
    ? resolvedReports.reduce((sum, r) => sum + (r.resolvedAt! - r.createdAt), 0) / resolvedReports.length / (1000 * 60 * 60)
    : 0;

  const criticalCount = reports.filter(r => r.priority >= 8).length;
  
  const verifiedCount = reports.filter(r => 
    r.status === ReportStatus.VERIFIED || r.status === ReportStatus.IN_PROGRESS || r.status === ReportStatus.RESOLVED
  ).length;
  const verificationRate = reports.length > 0 ? (verifiedCount / reports.length) * 100 : 0;

  const heatmapData = generateHeatmapData(reports);

  const recentReports = reports.filter(r => r.createdAt >= now - 7 * 24 * 60 * 60 * 1000);
  const previousReports = reports.filter(r => 
    r.createdAt >= now - 14 * 24 * 60 * 60 * 1000 && r.createdAt < now - 7 * 24 * 60 * 60 * 1000
  );
  
  const trendDirection = recentReports.length > previousReports.length * 1.1 
    ? 'up' 
    : recentReports.length < previousReports.length * 0.9 
      ? 'down' 
      : 'stable';
  
  const monthlyGrowth = previousReports.length > 0 
    ? ((recentReports.length - previousReports.length) / previousReports.length) * 100 
    : 0;

  return {
    totalReports: reports.length,
    reportsByStatus,
    reportsByType,
    reportsByDay,
    avgResolutionTime,
    criticalCount,
    verificationRate,
    heatmapData,
    trendDirection,
    monthlyGrowth,
  };
}

function generateHeatmapData(reports: Report[]): HeatmapPoint[] {
  const gridSize = 0.005;
  const grid: Map<string, { count: number; totalLat: number; totalLng: number; types: DamageType[] }> = new Map();

  for (const report of reports) {
    const gridLat = Math.floor(report.lat / gridSize) * gridSize;
    const gridLng = Math.floor(report.lng / gridSize) * gridSize;
    const key = `${gridLat},${gridLng}`;

    if (!grid.has(key)) {
      grid.set(key, { count: 0, totalLat: 0, totalLng: 0, types: [] });
    }
    
    const cell = grid.get(key)!;
    cell.count++;
    cell.totalLat += report.lat;
    cell.totalLng += report.lng;
    cell.types.push(report.damageType);
  }

  const maxCount = Math.max(...Array.from(grid.values()).map(c => c.count));

  return Array.from(grid.entries()).map(([key, cell]) => {
    const [baseLat, baseLng] = key.split(',').map(Number);
    return {
      lat: cell.totalLat / cell.count,
      lng: cell.totalLng / cell.count,
      intensity: cell.count / maxCount,
      radius: Math.max(20, Math.min(100, cell.count * 15)),
      type: getMostFrequentType(cell.types),
    };
  });
}

function getMostFrequentType(types: DamageType[]): DamageType {
  const counts: Record<string, number> = {};
  let maxCount = 0;
  let dominantType = types[0];

  for (const type of types) {
    counts[type] = (counts[type] || 0) + 1;
    if (counts[type] > maxCount) {
      maxCount = counts[type];
      dominantType = type;
    }
  }

  return dominantType;
}

export function getStatusChartData(reportsByStatus: Record<ReportStatus, number>): ChartData {
  const labels = Object.keys(reportsByStatus).map(s => {
    const status = s as ReportStatus;
    return {
      [ReportStatus.GHOST]: 'Unverified',
      [ReportStatus.ACTIVE]: 'Pending',
      [ReportStatus.VERIFIED]: 'Verified',
      [ReportStatus.IN_PROGRESS]: 'In Progress',
      [ReportStatus.RESOLVED]: 'Resolved',
    }[status];
  });

  const values = Object.values(reportsByStatus);
  const colors = Object.keys(reportsByStatus).map(s => STATUS_COLORS[s as ReportStatus]);

  return { labels, values, colors };
}

export function getTypeChartData(reportsByType: Record<DamageType, number>): ChartData {
  const labels = Object.keys(reportsByType).map(t => DAMAGE_TYPE_LABELS[t as DamageType]);
  const values = Object.values(reportsByType);
  const colors = Object.keys(reportsByType).map(t => TYPE_COLORS[t as DamageType]);

  return { labels, values, colors };
}

export function useAnalytics(reports: Report[]) {
  return useMemo(() => calculateAnalytics(reports), [reports]);
}

export function formatResolutionTime(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} minutes`;
  }
  if (hours < 24) {
    return `${Math.round(hours)} hours`;
  }
  return `${Math.round(hours / 24)} days`;
}

export function getPerformanceScore(data: AnalyticsData): number {
  let score = 100;

  score -= (data.reportsByStatus[ReportStatus.ACTIVE] / Math.max(data.totalReports, 1)) * 30;
  score -= (data.criticalCount / Math.max(data.totalReports, 1)) * 20;
  
  if (data.avgResolutionTime > 168) score -= 20;
  else if (data.avgResolutionTime > 72) score -= 10;
  else if (data.avgResolutionTime < 24) score += 10;

  if (data.verificationRate < 50) score -= 15;
  else if (data.verificationRate > 80) score += 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getScoreGrade(score: number): { grade: string; color: string; description: string } {
  if (score >= 90) return { grade: 'A+', color: '#22C55E', description: 'Excellent' };
  if (score >= 80) return { grade: 'A', color: '#22C55E', description: 'Great' };
  if (score >= 70) return { grade: 'B', color: '#84CC16', description: 'Good' };
  if (score >= 60) return { grade: 'C', color: '#FBBF24', description: 'Average' };
  if (score >= 50) return { grade: 'D', color: '#F97316', description: 'Below Average' };
  return { grade: 'F', color: '#EF4444', description: 'Needs Improvement' };
}
