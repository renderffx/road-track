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

  const user = jsonDB.users.getById(userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      workerZone: user.workerZone,
      workerSkills: user.workerSkills,
      citizenPoints: user.citizenPoints,
      citizenReports: user.citizenReports,
      citizenResolved: user.citizenResolved,
      citizenBadges: user.citizenBadges,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    },
  });
}
