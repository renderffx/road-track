import { NextRequest, NextResponse } from 'next/server';
import { jsonDB } from '@/lib/storage';
import { Announcement, AnnouncementType } from '@/types';

function getSessionUserId(request: NextRequest): string | null {
  return request.cookies.get('rt-session')?.value || null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const active = searchParams.get('active') === 'true';
  const neighborhood = searchParams.get('neighborhood');

  let announcements = jsonDB.announcements.getAll();

  if (active) {
    announcements = jsonDB.announcements.getActive();
  }

  if (neighborhood) {
    announcements = announcements.filter(
      a => !a.neighborhood || a.neighborhood === neighborhood || a.type === AnnouncementType.BLAST
    );
  }

  return NextResponse.json({ announcements });
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
  const { title, content, type } = body;

  if (!title || !content || !type) {
    return NextResponse.json({ error: 'title, content, and type required' }, { status: 400 });
  }

  const announcement: Announcement = {
    id: `ann-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    content,
    type: type as AnnouncementType,
    neighborhood: body.neighborhood,
    createdBy: userId,
    createdAt: Date.now(),
    expiresAt: body.expiresAt,
    isActive: true,
    recipientCount: body.recipientCount,
  };

  jsonDB.announcements.add(announcement);

  return NextResponse.json({ success: true, announcement });
}

export async function PUT(request: NextRequest) {
  const userId = getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const user = jsonDB.users.getById(userId);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  const updated = jsonDB.announcements.update(body.id, body);
  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, announcement: updated });
}

export async function DELETE(request: NextRequest) {
  const userId = getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const user = jsonDB.users.getById(userId);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  const success = jsonDB.announcements.delete(id);
  return NextResponse.json({ success });
}
