import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { PriceGroup } from '@/types';
import { logActionWithIp } from '@/lib/log-helper';
import { hasPermission } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user || !hasPermission(session.user.role, 'manage_price_groups')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const group = await queryOne<PriceGroup>(
    `SELECT pg.*,
      CASE 
        WHEN pg.branch_id IS NULL THEN NULL
        WHEN pg.branch_id LIKE '%,%' THEN (
          SELECT STRING_AGG(b.name, ', ' ORDER BY b.name)
          FROM branches b
          WHERE b.id::TEXT = ANY(STRING_TO_ARRAY(pg.branch_id, ','))
        )
        ELSE (SELECT name FROM branches WHERE id::TEXT = pg.branch_id LIMIT 1)
      END as branch_name
     FROM price_groups pg
     WHERE pg.id = $1`,
    [id]
  );

  if (!group) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(group);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user || !hasPermission(session.user.role, 'manage_price_groups')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, branch_id, telegram_chat_id, line_group_id, is_active, sort_order } = body;

    const updated = await queryOne<PriceGroup>(
      `UPDATE price_groups 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           branch_id = $3,
           telegram_chat_id = $4,
           line_group_id = $5,
           is_active = COALESCE($6, is_active),
           sort_order = COALESCE($7, sort_order)
       WHERE id = $8
       RETURNING *`,
      [name, description, branch_id, telegram_chat_id, line_group_id, is_active, sort_order, id]
    );

    await logActionWithIp(request, session.user.id, 'update_group', 'price_group', id, { name });

    revalidatePath('/admin/manage-groups');
    revalidatePath('/admin/price-images');

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating price group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user || !hasPermission(session.user.role, 'manage_price_groups')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const group = await queryOne<PriceGroup>(
      `SELECT * FROM price_groups WHERE id = $1`,
      [id]
    );

    if (!group) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await query(`DELETE FROM price_groups WHERE id = $1`, [id]);

    await logActionWithIp(request, session.user.id, 'delete_group', 'price_group', id, { name: group.name });

    revalidatePath('/admin/manage-groups');
    revalidatePath('/admin/price-images');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting price group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
