import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { PriceGroup } from '@/types';
import { logActionWithIp } from '@/lib/log-helper';
import { hasPermission } from '@/lib/permissions';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !hasPermission(session.user.role, 'manage_price_groups')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const groups = await query<PriceGroup>(
    `SELECT pg.*, b.name as branch_name,
      (SELECT COUNT(*) FROM price_group_images pgi WHERE pgi.price_group_id = pg.id) as image_count,
      (SELECT COUNT(*) FROM user_group_access uga WHERE uga.price_group_id = pg.id) as user_count
     FROM price_groups pg
     LEFT JOIN branches b ON b.id = pg.branch_id
     ORDER BY pg.sort_order, pg.name`
  );

  return NextResponse.json(groups);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !hasPermission(session.user.role, 'manage_price_groups')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, branch_id, telegram_chat_id, line_group_id } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // สร้าง sort_order อัตโนมัติจากจำนวนกลุ่มที่มีอยู่
    const maxSortOrder = await queryOne<{ max: number }>(
      `SELECT COALESCE(MAX(sort_order), -1) as max FROM price_groups`
    );
    const nextSortOrder = (maxSortOrder?.max || 0) + 1;

    const newGroup = await queryOne<PriceGroup>(
      `INSERT INTO price_groups (name, description, branch_id, telegram_chat_id, line_group_id, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description || null, branch_id || null, telegram_chat_id || null, line_group_id || null, nextSortOrder]
    );

    await logActionWithIp(request, session.user.id, 'create_group', 'price_group', newGroup?.id, { name });

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error('Error creating price group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
