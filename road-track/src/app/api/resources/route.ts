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
  const workerId = searchParams.get('workerId');
  const reportId = searchParams.get('reportId');

  let requests = jsonDB.resourceRequests.getAll();

  if (workerId) requests = requests.filter(r => r.workerId === workerId);
  if (reportId) requests = requests.filter(r => r.reportId === reportId);

  return NextResponse.json({ resourceRequests: requests });
}

export async function POST(request: NextRequest) {
  const userId = getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const { reportId, resource, quantity, unit } = body;

  if (!reportId || !resource || !quantity || !unit) {
    return NextResponse.json({ error: 'reportId, resource, quantity, unit required' }, { status: 400 });
  }

  const request_entry = {
    id: `res-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    reportId,
    workerId: userId,
    resource,
    quantity,
    unit,
    status: 'pending' as const,
    createdAt: Date.now(),
    notes: body.notes,
  };

  jsonDB.resourceRequests.add(request_entry);
  return NextResponse.json({ success: true, resourceRequest: request_entry });
}

export async function PUT(request: NextRequest) {
  const userId = getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  const updated = jsonDB.resourceRequests.update(body.id, body);
  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, resourceRequest: updated });
}
