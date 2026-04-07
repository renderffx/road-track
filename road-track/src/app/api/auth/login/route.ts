import { NextRequest, NextResponse } from 'next/server';
import { jsonDB } from '@/lib/storage';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  const user = jsonDB.users.getByEmail(email);
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  if (user.password !== password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  if (!user.isActive) {
    return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
  }

  jsonDB.users.update(user.id, { lastLogin: Date.now() });

  const response = NextResponse.json({
    success: true,
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
    },
  });

  response.cookies.set('rt-session', user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return response;
}
