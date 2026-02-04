import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { PriceGroup } from '@/types';
import { logActionWithIp } from '@/lib/log-helper';
import { hasPermission } from '@/lib/permissions';

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
    `SELECT pg.*, b.name as branch_name
     FROM price_groups pg
     LEFT JOIN branches b ON b.id = pg.branch_id
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
    const { name, description, branch_id, telegram_chat_id, is_active, sort_order } = body;

    const updated = await queryOne<PriceGroup>(
      `UPDATE price_groups 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           branch_id = $3,
           telegram_chat_id = $4,
           is_active = COALESCE($5, is_active),
           sort_order = COALESCE($6, sort_order)
       WHERE id = $7
       RETURNING *`,
      [name, description, branch_id, telegram_chat_id, is_active, sort_order, id]
    );

    await logActionWithIp(request, session.user.id, 'update_group', 'price_group', id, { name });

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting price group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
