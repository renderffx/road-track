import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { ReportStatus } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const daysBack = parseInt(searchParams.get('days') || '30');

  const reports = await storage.get();
  const now = Date.now();
  const cutoffTime = now - daysBack * 24 * 60 * 60 * 1000;

  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  let criticalCount = 0;
  let totalVerifications = 0;
  let resolvedReports = 0;
  let totalResolutionTime = 0;

  for (const report of reports) {
    byStatus[report.status] = (byStatus[report.status] || 0) + 1;
    byType[report.damageType] = (byType[report.damageType] || 0) + 1;
    totalVerifications += report.verificationCount;

    if (report.priority >= 8) criticalCount++;

    if (report.status === ReportStatus.RESOLVED && report.resolvedAt) {
      resolvedReports++;
      totalResolutionTime += report.resolvedAt - report.createdAt;
    }
  }

  const avgResolutionTime = resolvedReports > 0 
    ? totalResolutionTime / resolvedReports / (1000 * 60 * 60)
    : 0;

  const verifiedCount = reports.filter(r =>
    r.status === ReportStatus.VERIFIED ||
    r.status === ReportStatus.IN_PROGRESS ||
    r.status === ReportStatus.RESOLVED
  ).length;

  const verificationRate = reports.length > 0 ? (verifiedCount / reports.length) * 100 : 0;

  let score = 100;
  score -= (byStatus[ReportStatus.ACTIVE] || 0) / Math.max(reports.length, 1) * 30;
  score -= criticalCount / Math.max(reports.length, 1) * 20;
  if (avgResolutionTime > 168) score -= 20;
  else if (avgResolutionTime > 72) score -= 10;
  if (verificationRate < 50) score -= 15;
  else if (verificationRate > 80) score += 10;
  score = Math.max(0, Math.min(100, Math.round(score)));

  return NextResponse.json({
    totalReports: reports.length,
    byStatus,
    byType,
    criticalCount,
    avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
    verificationRate: Math.round(verificationRate),
    performanceScore: score,
  });
}
