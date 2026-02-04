import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !hasPermission(session.user.role, 'manage_users')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await params;
    const { branchName } = await request.json();

    if (!branchName) {
      return NextResponse.json({ error: 'Branch name is required' }, { status: 400 });
    }

    // Get branch ID from name
    const branches = await query<{ id: string }>(
      `SELECT id FROM branches WHERE name = $1`,
      [branchName]
    );

    if (branches.length === 0) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    const branchId = branches[0].id;

    // Remove user from branch
    await query(
      `DELETE FROM user_branches WHERE user_id = $1 AND branch_id = $2`,
      [userId, branchId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing user from branch:', error);
    return NextResponse.json(
      { error: 'Failed to remove user from branch' },
      { status: 500 }
    );
  }
}

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
    const { branchIds } = await request.json();

    if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0) {
      return NextResponse.json({ error: 'Invalid branch IDs' }, { status: 400 });
    }

    // Add user to branches
    for (const branchId of branchIds) {
      await query(
        `INSERT INTO user_branches (user_id, branch_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, branch_id) DO NOTHING`,
        [userId, branchId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding user to branches:', error);
    return NextResponse.json(
      { error: 'Failed to add user to branches' },
      { status: 500 }
    );
  }
}
