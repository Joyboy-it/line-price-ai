import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, queryOne, transaction } from '@/lib/db';
import { AccessRequest } from '@/types';
import { logActionWithIp } from '@/lib/log-helper';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'operator')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { price_group_ids, branch_ids } = body;

    if (!price_group_ids || !Array.isArray(price_group_ids) || price_group_ids.length === 0) {
      return NextResponse.json({ error: 'Price group IDs are required' }, { status: 400 });
    }

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

    await transaction(async (client) => {
      // Update request status
      await client.query(
        `UPDATE access_requests 
         SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
         WHERE id = $2`,
        [session.user.id, id]
      );

      // Grant access to price groups
      for (const groupId of price_group_ids) {
        await client.query(
          `INSERT INTO user_group_access (user_id, price_group_id, granted_by)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, price_group_id) DO NOTHING`,
          [accessRequest.user_id, groupId, session.user.id]
        );
      }

      // Assign branches if provided
      if (branch_ids && Array.isArray(branch_ids) && branch_ids.length > 0) {
        for (const branchId of branch_ids) {
          await client.query(
            `INSERT INTO user_branches (user_id, branch_id, assigned_by)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, branch_id) DO NOTHING`,
            [accessRequest.user_id, branchId, session.user.id]
          );
        }
      }
    });

    await logActionWithIp(request, session.user.id, 'approve_request', 'access_request', id, {
      user_id: accessRequest.user_id,
      price_group_ids,
      branch_ids: branch_ids || [],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
