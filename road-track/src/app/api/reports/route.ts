import { NextRequest, NextResponse } from 'next/server';
import { jsonDB } from '@/lib/storage';
import { Report, ReportStatus, DamageType } from '@/types';

function getSessionUserId(request: NextRequest): string | null {
  return request.cookies.get('rt-session')?.value || null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  const userId = searchParams.get('userId');
  const assignedTo = searchParams.get('assignedTo');

  let reports = jsonDB.reports.getAll();

  if (status) reports = reports.filter(r => r.status === status);
  if (type) reports = reports.filter(r => r.damageType === type);
  if (userId) reports = reports.filter(r => r.userId === userId || (r.deviceId === userId && !r.userId));
  if (assignedTo) reports = reports.filter(r => r.assignedTo === assignedTo);

  const total = reports.length;
  reports = reports.slice(offset, offset + limit);

  return NextResponse.json({
    reports,
    total,
    lastUpdated: jsonDB.reports.getAll().length > 0 ? Math.max(...jsonDB.reports.getAll().map(r => r.updatedAt)) : Date.now(),
    hasMore: offset + limit < total,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const userId = getSessionUserId(request);

  const required = ['lat', 'lng', 'damageType', 'severity', 'deviceId'];
  for (const field of required) {
    if (body[field] === undefined || body[field] === null) {
      return NextResponse.json({ error: `Missing: ${field}` }, { status: 400 });
    }
  }

  const reports = jsonDB.reports.getAll();
  const metersPerDegree = 111320;
  const nearbyReports = reports.filter((r) => {
    const latDiff = Math.abs(body.lat - r.lat) * metersPerDegree;
    const lngDiff = Math.abs(body.lng - r.lng) * metersPerDegree;
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) < 50;
  });

  if (nearbyReports.length > 0) {
    const primary = nearbyReports[0];
    const verificationCount = primary.verificationCount + 1;
    const upvotes = [...(primary.upvotes || []), body.deviceId];
    const updated = jsonDB.reports.update(primary.id, {
      verificationCount,
      upvotes,
      priority: Math.min(10, Math.max(1, verificationCount * 2 + body.severity)),
      status: verificationCount >= 3 ? ReportStatus.VERIFIED : ReportStatus.ACTIVE,
    });

    if (userId) {
      jsonDB.gamification.addPoints(userId, 5);
      const gamification = jsonDB.gamification.getOrCreate(userId);
      jsonDB.gamification.update(userId, { reportsVerified: gamification.reportsVerified + 1 });
    }

    return NextResponse.json({
      success: true,
      merged: true,
      report: updated,
      duplicateCount: nearbyReports.length + 1,
    });
  }

  const now = Date.now();
  const newReport: Report = {
    id: `rep-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    imageUrl: body.imageUrl,
    lat: body.lat,
    lng: body.lng,
    address: body.address,
    damageType: body.damageType,
    severity: body.severity,
    description: body.description,
    userId: userId || undefined,
    deviceId: body.deviceId,
    isAnonymous: body.isAnonymous || false,
    verificationCount: 1,
    upvotes: [body.deviceId],
    status: ReportStatus.ACTIVE,
    priority: Math.min(10, Math.max(1, body.severity * 2)),
    createdAt: now,
    updatedAt: now,
    videoUrl: body.videoUrl,
    voiceNoteUrl: body.voiceNoteUrl,
    beforeImages: body.beforeImages,
    neighborhood: body.neighborhood,
    slaDeadline: now + 7 * 24 * 60 * 60 * 1000,
  };

  jsonDB.reports.add(newReport);

  if (userId) {
    jsonDB.gamification.addPoints(userId, 10);
    const gamification = jsonDB.gamification.getOrCreate(userId);
    jsonDB.gamification.update(userId, {
      reportsSubmitted: gamification.reportsSubmitted + 1,
      lastActivity: now,
    });
    const user = jsonDB.users.getById(userId);
    if (user) {
      jsonDB.users.update(userId, { citizenReports: user.citizenReports + 1 });
    }
  }

  return NextResponse.json({ success: true, report: newReport });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  const updates = { ...body };
  if (body.status === ReportStatus.RESOLVED) {
    const existing = jsonDB.reports.getById(body.id);
    if (existing && !existing.resolvedAt) {
      updates.resolvedAt = Date.now();
    }
  }

  const updated = jsonDB.reports.update(body.id, updates);

  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (body.status === ReportStatus.RESOLVED && updated.userId) {
    jsonDB.gamification.addPoints(updated.userId, 25);
    const gamification = jsonDB.gamification.getOrCreate(updated.userId);
    jsonDB.gamification.update(updated.userId, {
      reportsResolved: gamification.reportsResolved + 1,
    });
  }

  return NextResponse.json({ success: true, report: updated });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  const success = jsonDB.reports.delete(id);
  return NextResponse.json({ success });
}
