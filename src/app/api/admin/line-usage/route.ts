import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !hasPermission(session.user.role, 'view_analytics')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let lineUsage = {
    totalMessages: 0,
    thisMonth: 0,
    lastMonth: 0,
    freeQuotaRemaining: 1000,
    freeQuotaLimit: 1000,
    percentUsed: 0,
    error: null as string | null,
  };

  const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    lineUsage.error = 'LINE_CHANNEL_ACCESS_TOKEN not configured';
    return NextResponse.json(lineUsage);
  }

  try {
    const lineResponse = await fetch('https://api.line.me/v2/bot/message/quota/consumption', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
    });

    if (lineResponse.ok) {
      const lineData = await lineResponse.json();
      lineUsage = {
        totalMessages: lineData.totalUsage || 0,
        thisMonth: lineData.totalUsage || 0,
        lastMonth: 0,
        freeQuotaRemaining: Math.max(0, 1000 - (lineData.totalUsage || 0)),
        freeQuotaLimit: 1000,
        percentUsed: Math.round(((lineData.totalUsage || 0) / 1000) * 100),
        error: null,
      };
    } else {
      lineUsage.error = `LINE API Error: ${lineResponse.status}`;
    }
  } catch (error) {
    console.error('[LINE Usage API] Error:', error);
    lineUsage.error = error instanceof Error ? error.message : 'Unknown error';
  }

  return NextResponse.json(lineUsage);
}
