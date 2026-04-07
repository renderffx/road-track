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
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

  const budget = jsonDB.budget.getByMonth(month, year);
  return NextResponse.json({ budget });
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
  const { category, allocated, spent, month, year } = body;

  if (!category || allocated === undefined || month === undefined || year === undefined) {
    return NextResponse.json({ error: 'category, allocated, month, year required' }, { status: 400 });
  }

  const entry = {
    id: `budget-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    category,
    allocated,
    spent: spent || 0,
    month,
    year,
    createdAt: Date.now(),
  };

  jsonDB.budget.add(entry);
  return NextResponse.json({ success: true, entry });
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

  const updated = jsonDB.budget.update(body.id, body);
  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, entry: updated });
}
