import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, queryOne, transaction } from '@/lib/db';
import { canReceiveGoods } from '@/lib/direct-to-factory/customer-access';
import { RECEIVE_NOTICE_FIELDS, parseReceiveSubmission } from '@/lib/receive-goods';

async function guard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!(await canReceiveGoods(session.user.id))) {
    return { error: NextResponse.json({ error: 'บัญชีนี้ยังไม่ได้รับอนุญาตให้แจ้งรับสินค้า' }, { status: 403 }) };
  }
  return { userId: session.user.id };
}

export async function GET() {
  const access = await guard();
  if ('error' in access && access.error) return access.error;

  try {
    const rows = await query(
      `SELECT ${RECEIVE_NOTICE_FIELDS}
       FROM receive_goods_notices n
       LEFT JOIN receive_goods_items i ON i.notice_id = n.id
       WHERE n.user_id = $1
       GROUP BY n.id
       ORDER BY n.created_at DESC
       LIMIT 100`,
      [access.userId]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error listing receive-goods notices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const access = await guard();
  if ('error' in access && access.error) return access.error;

  try {
    const parsed = parseReceiveSubmission(await request.json());
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const customer = await queryOne<{ destination_name: string | null }>(
      `SELECT NULLIF(btrim(shop_name), '') AS destination_name
       FROM users WHERE id = $1`,
      [access.userId]
    );

    const saved = await transaction(async (client) => {
      const inserted = await client.query<{ id: string; queue_no: number }>(
        `INSERT INTO receive_goods_notices (user_id, destination_name, note)
         VALUES ($1, $2, $3)
         RETURNING id, queue_no`,
        [access.userId, customer?.destination_name ?? null, parsed.value.note]
      );
      const id = inserted.rows[0]?.id;
      if (!id) throw new Error('missing notice id');
      const rank = await client.query<{ open_rank: number }>(
        `SELECT COUNT(*)::int AS open_rank
         FROM receive_goods_notices
         WHERE status IN ('waiting', 'queued')
           AND (created_at < (SELECT created_at FROM receive_goods_notices WHERE id = $1)
                OR (created_at = (SELECT created_at FROM receive_goods_notices WHERE id = $1) AND id <= $1))`,
        [id]
      );
      for (const [index, item] of parsed.value.items.entries()) {
        await client.query(
          `INSERT INTO receive_goods_items (notice_id, product_type, quantity, unit, sort_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, item.product_type, item.quantity, item.unit, index]
        );
      }
      return { id, open_rank: rank.rows[0]?.open_rank };
    });
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error('Error creating receive-goods notice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
