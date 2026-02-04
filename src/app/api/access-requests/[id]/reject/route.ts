import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { AccessRequest } from '@/types';
import { logActionWithIp } from '@/lib/log-helper';
import { hasPermission } from '@/lib/permissions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user || !hasPermission(session.user.role, 'approve_requests')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { reject_reason } = body;

    const accessRequest = await queryOne<AccessRequest>(
      `SELECT * FROM access_requests WHERE id = $1`,
      [id]
    );

    if (!accessRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (accessRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 400 });
    }

    await query(
      `UPDATE access_requests 
       SET status = 'rejected', reject_reason = $1, reviewed_by = $2, reviewed_at = NOW()
       WHERE id = $3`,
      [reject_reason || null, session.user.id, id]
    );

    await logActionWithIp(request, session.user.id, 'reject_request', 'access_request', id, {
      user_id: accessRequest.user_id,
      reject_reason,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rejecting request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
