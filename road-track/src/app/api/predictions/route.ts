import { NextRequest, NextResponse } from 'next/server';
import { jsonDB } from '@/lib/storage';
import { DamageType } from '@/types';

function getSessionUserId(request: NextRequest): string | null {
  return request.cookies.get('rt-session')?.value || null;
}

export async function GET(request: NextRequest) {
  const userId = getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const user = jsonDB.users.getById(userId);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const predictions = jsonDB.predictions.getAll();
  return NextResponse.json({ predictions });
}

export async function POST(request: NextRequest) {
  const userId = getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const user = jsonDB.users.getById(userId);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const { damageType, lat, lng, probability, predictedDate, basis } = body;

  if (!damageType || lat === undefined || lng === undefined || probability === undefined) {
    return NextResponse.json({ error: 'damageType, lat, lng, probability required' }, { status: 400 });
  }

  const prediction = {
    id: `pred-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    damageType: damageType as DamageType,
    lat,
    lng,
    neighborhood: body.neighborhood,
    probability,
    predictedDate: predictedDate || Date.now() + 30 * 24 * 60 * 60 * 1000,
    basis: basis || 'Historical pattern analysis',
    createdAt: Date.now(),
  };

  jsonDB.predictions.add(prediction);
  return NextResponse.json({ success: true, prediction });
}
