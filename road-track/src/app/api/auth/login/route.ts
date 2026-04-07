import { NextRequest, NextResponse } from 'next/server';
import { jsonDB } from '@/lib/storage';

const DEMO_USERS = [
  { id: 'admin-001', email: 'admin@roadtrack.com', password: 'admin123', name: 'Admin User', role: 'admin' },
  { id: 'worker-001', email: 'worker@roadtrack.com', password: 'worker123', name: 'Field Worker', role: 'field_worker', workerZone: 'Zone A' },
  { id: 'citizen-1', email: 'citizen1@example.com', password: 'citizen123', name: 'Alice Johnson', role: 'citizen' },
];

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  let user = jsonDB.users.getByEmail(email);
  
  if (!user) {
    const demoUser = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (demoUser) {
      user = {
        ...demoUser,
        createdAt: Date.now(),
        isActive: true,
        citizenPoints: 0,
        citizenReports: 0,
        citizenResolved: 0,
        citizenBadges: [],
      };
      jsonDB.users.add(user);
    }
  }

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
    secure: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return response;
}
