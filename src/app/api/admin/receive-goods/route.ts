import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, transaction } from '@/lib/db';
import { requireStaff } from '@/lib/direct-to-factory/customer-access';
import { isUuid } from '@/lib/direct-to-factory/validation';
import { RECEIVE_NOTICE_FIELDS, parseReceiveSubmission } from '@/lib/receive-goods';

export async function GET() {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  try {
    const rows = await query(
      `SELECT ${RECEIVE_NOTICE_FIELDS}, NULLIF(btrim(u.shop_name), '') AS shop_name
       FROM receive_goods_notices n
       JOIN users u ON u.id = n.user_id
       LEFT JOIN receive_goods_items i ON i.notice_id = n.id
       GROUP BY n.id, u.shop_name
       ORDER BY n.created_at DESC
       LIMIT 200`
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error listing receive-goods queue:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  try {
    const body = await request.json();
    if (!isUuid(body?.user_id)) {
      return NextResponse.json({ error: 'กรุณาเลือกร้าน' }, { status: 400 });
    }
    const parsed = parseReceiveSubmission(body);
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const customer = await queryOne<{ shop_name: string }>(
      `SELECT btrim(shop_name) AS shop_name
       FROM users
       WHERE id = $1 AND is_active = true AND NULLIF(btrim(shop_name), '') IS NOT NULL`,
      [body.user_id]
    );
    if (!customer) return NextResponse.json({ error: 'ไม่พบร้านนี้' }, { status: 404 });

    const saved = await transaction(async (client) => {
      const inserted = await client.query<{ id: string; queue_no: number }>(
        `INSERT INTO receive_goods_notices (user_id, destination_name, note)
         VALUES ($1, $2, $3)
         RETURNING id, queue_no`,
        [body.user_id, customer.shop_name, parsed.value.note]
      );
      const id = inserted.rows[0]?.id;
      const queueNo = inserted.rows[0]?.queue_no;
      if (!id) throw new Error('missing notice id');
      for (const [index, item] of parsed.value.items.entries()) {
        await client.query(
          `INSERT INTO receive_goods_items (notice_id, product_type, quantity, unit, sort_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, item.product_type, item.quantity, item.unit, index]
        );
      }
      return { id, queue_no: queueNo };
    });
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error('Error creating staff receive-goods notice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
