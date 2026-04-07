import { NextRequest, NextResponse } from 'next/server';
import { addSubscription, getSubscriptionCount } from '@/lib/push-store';

export async function POST(request: NextRequest) {
  try {
    const { subscription } = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription' },
        { status: 400 }
      );
    }

    addSubscription(subscription.endpoint, subscription);
    console.log('Push subscription saved:', subscription.endpoint);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save subscription:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ count: getSubscriptionCount() });
}
