import { NextRequest, NextResponse } from 'next/server';
import { jsonDB } from '@/lib/storage';

function getSessionUserId(request: NextRequest): string | null {
  return request.cookies.get('rt-session')?.value || null;
}

export async function GET(request: NextRequest) {
  const userId = getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get('userId') || userId;

  const record = jsonDB.gamification.getOrCreate(targetUserId);
  const leaderboard = jsonDB.gamification.getLeaderboard();
  const position = leaderboard.findIndex(g => g.userId === targetUserId) + 1;
  record.leaderboardPosition = position;

  return NextResponse.json({ record, leaderboard: leaderboard.slice(0, 20) });
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
  const { targetUserId, points, badge } = body;

  if (!targetUserId) {
    return NextResponse.json({ error: 'targetUserId required' }, { status: 400 });
  }

  const record = jsonDB.gamification.getOrCreate(targetUserId);

  if (points) {
    jsonDB.gamification.addPoints(targetUserId, points);
  }

  if (badge && !record.badges.includes(badge)) {
    record.badges.push(badge);
    const records = jsonDB.gamification.getAll();
    const index = records.findIndex(g => g.userId === targetUserId);
    if (index !== -1) {
      records[index] = record;
      jsonDB.gamification.save(records);
    }
  }

  return NextResponse.json({ success: true, record });
}
