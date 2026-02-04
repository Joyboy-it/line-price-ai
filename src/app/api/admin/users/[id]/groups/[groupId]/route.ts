import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !hasPermission(session.user.role, 'manage_users')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId, groupId } = await params;

    // Remove user from price group
    await query(
      `DELETE FROM user_group_access WHERE user_id = $1 AND price_group_id = $2`,
      [userId, groupId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing user from group:', error);
    return NextResponse.json(
      { error: 'Failed to remove user from group' },
      { status: 500 }
    );
  }
}
