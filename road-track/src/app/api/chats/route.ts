import { NextRequest, NextResponse } from 'next/server';
import { jsonDB } from '@/lib/storage';
import { ChatMessage, ChatRole } from '@/types';

function getSessionUserId(request: NextRequest): string | null {
  return request.cookies.get('rt-session')?.value || null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');
  const reportId = searchParams.get('reportId');

  if (!chatId && !reportId) {
    return NextResponse.json({ error: 'chatId or reportId required' }, { status: 400 });
  }

  const messages = chatId
    ? jsonDB.chats.getByChatId(chatId)
    : jsonDB.chats.getByReportId(reportId!);

  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const userId = getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const { chatId, reportId, content } = body;

  if (!chatId || !reportId || !content) {
    return NextResponse.json({ error: 'chatId, reportId, and content required' }, { status: 400 });
  }

  const user = jsonDB.users.getById(userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const report = jsonDB.reports.getById(reportId);
  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const senderRole = user.role === 'field_worker' ? ChatRole.WORKER : ChatRole.CITIZEN;

  const message: ChatMessage = {
    id: `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    chatId,
    reportId,
    senderId: userId,
    senderName: user.name,
    senderRole,
    content,
    timestamp: Date.now(),
    isRead: false,
  };

  jsonDB.chats.add(message);

  return NextResponse.json({ success: true, message });
}

export async function PUT(request: NextRequest) {
  const userId = getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const { chatId } = body;

  if (!chatId) {
    return NextResponse.json({ error: 'chatId required' }, { status: 400 });
  }

  jsonDB.chats.markRead(chatId, userId);
  return NextResponse.json({ success: true });
}
