import { NextRequest, NextResponse } from 'next/server';
import { removeSubscription } from '@/lib/push-store';

export async function POST(request: NextRequest) {
  try {
    const { endpoint } = await request.json();

    if (endpoint) {
      removeSubscription(endpoint);
      console.log('Push subscription removed:', endpoint);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove subscription:', error);
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}
