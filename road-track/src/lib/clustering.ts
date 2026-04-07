import { Report, ReportStatus, DamageType } from '@/types';

export interface ClusterReport extends Report {
  clusterId: string;
  clusterSize: number;
  isClusterHead: boolean;
  mergedReports: string[];
}

export interface Cluster {
  id: string;
  reports: Report[];
  centerLat: number;
  centerLng: number;
  severity: number;
  priority: number;
  dominantType: string;
  status: ReportStatus;
  createdAt: number;
  updatedAt: number;
}

interface GeoPoint {
  lat: number;
  lng: number;
}

const METERS_PER_DEGREE_LAT = 111320;
const EARTH_RADIUS_KM = 6371;

export function haversineDistance(p1: GeoPoint, p2: GeoPoint): number {
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function metersToDegrees(meters: number, latitude: number): number {
  return meters / (METERS_PER_DEGREE_LAT * Math.cos(latitude * Math.PI / 180));
}

export function createClusters(reports: Report[], clusterRadiusMeters: number = 50): Cluster[] {
  if (reports.length === 0) return [];

  const clusters: Cluster[] = [];
  const processedIds = new Set<string>();

  for (const report of reports) {
    if (processedIds.has(report.id)) continue;

    const nearbyReports = reports.filter(r => {
      if (processedIds.has(r.id)) return false;
      if (r.id === report.id) return true;
      
      const distance = haversineDistance(
        { lat: report.lat, lng: report.lng },
        { lat: r.lat, lng: r.lng }
      ) * 1000;
      
      return distance <= clusterRadiusMeters;
    });

    if (nearbyReports.length === 0) continue;

    nearbyReports.forEach(r => processedIds.add(r.id));

    const cluster: Cluster = {
      id: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reports: nearbyReports,
      centerLat: nearbyReports.reduce((sum, r) => sum + r.lat, 0) / nearbyReports.length,
      centerLng: nearbyReports.reduce((sum, r) => sum + r.lng, 0) / nearbyReports.length,
      severity: Math.round(nearbyReports.reduce((sum, r) => sum + r.severity, 0) / nearbyReports.length),
      priority: calculateClusterPriority(nearbyReports),
      dominantType: findDominantType(nearbyReports),
      status: determineClusterStatus(nearbyReports),
      createdAt: Math.min(...nearbyReports.map(r => r.createdAt)),
      updatedAt: Math.max(...nearbyReports.map(r => r.updatedAt)),
    };

    clusters.push(cluster);
  }

  const unprocessedReports = reports.filter(r => !processedIds.has(r.id));
  for (const report of unprocessedReports) {
    clusters.push({
      id: `single_${report.id}`,
      reports: [report],
      centerLat: report.lat,
      centerLng: report.lng,
      severity: report.severity,
      priority: report.priority,
      dominantType: report.damageType,
      status: report.status,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    });
  }

  return clusters;
}

function calculateClusterPriority(reports: Report[]): number {
  const avgSeverity = reports.reduce((sum, r) => sum + r.severity, 0) / reports.length;
  const verificationBonus = Math.min(reports.length * 0.5, 3);
  const ageFactor = calculateAgeFactor(reports);
  
  return Math.min(10, Math.round((avgSeverity + verificationBonus + ageFactor) * 1));
}

function calculateAgeFactor(reports: Report[]): number {
  const oldestReport = Math.min(...reports.map(r => r.createdAt));
  const ageInHours = (Date.now() - oldestReport) / (1000 * 60 * 60);
  
  if (ageInHours > 168) return 3;
  if (ageInHours > 72) return 2;
  if (ageInHours > 24) return 1;
  return 0;
}

function findDominantType(reports: Report[]): string {
  const typeCounts: Record<string, number> = {};
  
  for (const report of reports) {
    typeCounts[report.damageType] = (typeCounts[report.damageType] || 0) + 1;
  }
  
  let maxCount = 0;
  let dominantType: DamageType = reports[0].damageType;
  
  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantType = type as DamageType;
    }
  }
  
  return dominantType;
}

function determineClusterStatus(reports: Report[]): ReportStatus {
  const statuses = reports.map(r => r.status);
  
  if (statuses.includes(ReportStatus.RESOLVED)) {
    const unresolvedCount = statuses.filter(s => s !== ReportStatus.RESOLVED).length;
    if (unresolvedCount === 0) return ReportStatus.RESOLVED;
    if (unresolvedCount < statuses.length / 2) return ReportStatus.IN_PROGRESS;
  }
  
  if (statuses.includes(ReportStatus.IN_PROGRESS)) {
    return ReportStatus.IN_PROGRESS;
  }
  
  if (statuses.includes(ReportStatus.VERIFIED)) {
    return ReportStatus.VERIFIED;
  }
  
  const totalVerifications = reports.reduce((sum, r) => sum + r.verificationCount, 0);
  if (totalVerifications >= reports.length * 3) {
    return ReportStatus.VERIFIED;
  }
  
  return ReportStatus.ACTIVE;
}

export function markReportsWithClusters(reports: Report[], clusterRadiusMeters: number = 50): ClusterReport[] {
  const clusters = createClusters(reports, clusterRadiusMeters);
  const result: ClusterReport[] = [];

  for (const cluster of clusters) {
    for (let i = 0; i < cluster.reports.length; i++) {
      const report = cluster.reports[i];
      result.push({
        ...report,
        clusterId: cluster.id,
        clusterSize: cluster.reports.length,
        isClusterHead: i === 0,
        mergedReports: cluster.reports.map(r => r.id),
      });
    }
  }

  return result;
}

export function getClusterStats(clusters: Cluster[]) {
  return {
    totalClusters: clusters.length,
    singleReports: clusters.filter(c => c.reports.length === 1).length,
    mergedClusters: clusters.filter(c => c.reports.length > 1).length,
    totalReports: clusters.reduce((sum, c) => sum + c.reports.length, 0),
    avgClusterSize: clusters.length > 0 
      ? clusters.reduce((sum, c) => sum + c.reports.length, 0) / clusters.length 
      : 0,
    criticalClusters: clusters.filter(c => c.priority >= 8).length,
    byType: clusters.reduce((acc, c) => {
      acc[c.dominantType] = (acc[c.dominantType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}

export function getOptimalClusterRadius(avgDensity: number): number {
  if (avgDensity > 100) return 30;
  if (avgDensity > 50) return 50;
  if (avgDensity > 20) return 75;
  return 100;
}
