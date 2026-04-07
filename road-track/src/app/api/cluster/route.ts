import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { ReportStatus } from '@/types';

interface Cluster {
  id: string;
  reports: any[];
  centerLat: number;
  centerLng: number;
  priority: number;
  count: number;
  status: ReportStatus;
}

function createClusters(reports: any[], radiusKm = 0.05): Cluster[] {
  const clusters: Cluster[] = [];
  const used = new Set<string>();

  for (const report of reports) {
    if (used.has(report.id)) continue;

    const nearby = reports.filter(r => {
      if (used.has(r.id)) return false;
      const dist = haversine(report.lat, report.lng, r.lat, r.lng);
      return dist <= radiusKm;
    });

    if (nearby.length === 0) continue;

    nearby.forEach(r => used.add(r.id));

    const statuses = nearby.map(r => r.status);
    let status = ReportStatus.ACTIVE;
    if (statuses.every(s => s === ReportStatus.RESOLVED)) status = ReportStatus.RESOLVED;
    else if (statuses.includes(ReportStatus.IN_PROGRESS)) status = ReportStatus.IN_PROGRESS;
    else if (statuses.includes(ReportStatus.VERIFIED)) status = ReportStatus.VERIFIED;

    clusters.push({
      id: `cluster_${clusters.length}`,
      reports: nearby,
      centerLat: nearby.reduce((s, r) => s + r.lat, 0) / nearby.length,
      centerLng: nearby.reduce((s, r) => s + r.lng, 0) / nearby.length,
      priority: Math.round(nearby.reduce((s, r) => s + r.priority, 0) / nearby.length),
      count: nearby.length,
      status,
    });
  }

  const singles = reports.filter(r => !used.has(r.id));
  for (const report of singles) {
    clusters.push({
      id: `single_${report.id}`,
      reports: [report],
      centerLat: report.lat,
      centerLng: report.lng,
      priority: report.priority,
      count: 1,
      status: report.status,
    });
  }

  return clusters;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: NextRequest) {
  const reports = await storage.get();
  const clusters = createClusters(reports);

  return NextResponse.json({
    clusters,
    totalReports: reports.length,
    totalClusters: clusters.length,
    mergedClusters: clusters.filter(c => c.count > 1).length,
  });
}
