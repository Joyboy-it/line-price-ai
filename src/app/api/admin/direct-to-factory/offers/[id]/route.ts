import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { logActionWithIp } from '@/lib/log-helper';
import { requireStaff } from '@/lib/direct-to-factory/customer-access';
import { cleanText, isPrice, isUuid } from '@/lib/direct-to-factory/validation';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: 'ไม่พบข้อเสนอ' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const sets: string[] = [];
    const values: unknown[] = [];
    const set = (column: string, value: unknown) => {
      values.push(value);
      sets.push(`${column} = $${values.length}`);
    };

    if (body?.price !== undefined) {
      if (!isPrice(body.price)) return NextResponse.json({ error: 'ราคาไม่ถูกต้อง' }, { status: 400 });
      set('price', Number(String(body.price).trim()));
    }
    for (const column of ['po_number', 'delivery_note_number'] as const) {
      if (body?.[column] !== undefined) {
        const value = cleanText(body[column], 200);
        if (value === undefined) return NextResponse.json({ error: 'ข้อความยาวเกินไป' }, { status: 400 });
        set(column, value);
      }
    }
    if (body?.is_active !== undefined) {
      if (typeof body.is_active !== 'boolean') {
        return NextResponse.json({ error: 'ค่า is_active ไม่ถูกต้อง' }, { status: 400 });
      }
      set('is_active', body.is_active);
    }
    if (sets.length === 0) {
      return NextResponse.json({ error: 'ไม่มีข้อมูลที่จะแก้ไข' }, { status: 400 });
    }

    values.push(id);
    const offer = await queryOne<{ id: string }>(
      `UPDATE agent_offers SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING id`,
      values
    );
    if (!offer) {
      return NextResponse.json({ error: 'ไม่พบข้อเสนอ' }, { status: 404 });
    }

    await logActionWithIp(request, guard.session.user.id, 'update_factory_settings', 'agent_offer', id, {
      action: 'update',
      price: body.price,
      po_number: body.po_number,
      delivery_note_number: body.delivery_note_number,
      is_active: body.is_active,
    });

    return NextResponse.json(offer);
  } catch (error) {
    console.error('Error updating offer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
