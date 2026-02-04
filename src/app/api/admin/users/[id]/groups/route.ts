import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !hasPermission(session.user.role, 'manage_users')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await params;
    const { groupIds } = await request.json();

    if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
      return NextResponse.json({ error: 'Invalid group IDs' }, { status: 400 });
    }

    // Add user to price groups
    for (const groupId of groupIds) {
      await query(
        `INSERT INTO user_group_access (user_id, price_group_id, granted_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, price_group_id) DO NOTHING`,
        [userId, groupId, session.user.id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding user to groups:', error);
    return NextResponse.json(
      { error: 'Failed to add user to groups' },
      { status: 500 }
    );
  }
}
