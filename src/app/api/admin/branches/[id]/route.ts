import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { logActionWithIp } from '@/lib/log-helper';
import { hasPermission } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user || !hasPermission(session.user.role, 'manage_branches')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const branch = await queryOne(
      `SELECT * FROM branches WHERE id = $1`,
      [id]
    );

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    return NextResponse.json(branch);
  } catch (error) {
    console.error('Error fetching branch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user || !hasPermission(session.user.role, 'manage_branches')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, code, sort_order, is_active } = body;

    const updated = await queryOne(
      `UPDATE branches 
       SET name = COALESCE($1, name),
           code = COALESCE($2, code),
           sort_order = COALESCE($3, sort_order),
           is_active = COALESCE($4, is_active),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, code?.toUpperCase(), sort_order, is_active, id]
    );

    await logActionWithIp(request, session.user.id, 'update_branch', 'branch', id, {
      name,
      code,
    });

    revalidatePath('/admin/branches');
    revalidatePath('/admin/manage-groups');

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating branch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const branch = await queryOne(
      `SELECT * FROM branches WHERE id = $1`,
      [id]
    );

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    // Check if branch has users
    const userCount = await queryOne(
      `SELECT COUNT(*) as count FROM user_branches WHERE branch_id = $1`,
      [id]
    );

    if ((userCount as any).count > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete branch with assigned users' 
      }, { status: 400 });
    }

    await query(`DELETE FROM branches WHERE id = $1`, [id]);

    await logActionWithIp(request, session.user.id, 'delete_branch', 'branch', id, {
      name: (branch as any).name,
    });

    revalidatePath('/admin/branches');
    revalidatePath('/admin/manage-groups');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting branch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
