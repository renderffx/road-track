import { NextRequest, NextResponse } from 'next/server';
import { jsonDB } from '@/lib/storage';
import { UserRole } from '@/types';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password, name, role } = body;

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Email, password, and name required' }, { status: 400 });
  }

  const existing = jsonDB.users.getByEmail(email);
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }

  const userRole = (role as UserRole) || UserRole.CITIZEN;
  if (![UserRole.CITIZEN, UserRole.FIELD_WORKER].includes(userRole)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const now = Date.now();
  const newUser = {
    id: `user-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    email,
    password,
    name,
    role: userRole,
    phone: body.phone,
    createdAt: now,
    isActive: true,
    workerZone: body.workerZone,
    workerSkills: body.workerSkills || [],
    citizenPoints: 0,
    citizenReports: 0,
    citizenResolved: 0,
    citizenBadges: [],
  };

  jsonDB.users.add(newUser);
  jsonDB.gamification.getOrCreate(newUser.id);

  const response = NextResponse.json({
    success: true,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      citizenPoints: 0,
      citizenReports: 0,
      citizenResolved: 0,
      citizenBadges: [],
    },
  });

  response.cookies.set('rt-session', newUser.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return response;
}
