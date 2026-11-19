import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { logActionWithIp } from '@/lib/log-helper';
import { requireStaff } from '@/lib/direct-to-factory/customer-access';
import { cleanText, isPrice, isUuid, offerPriceFromParts } from '@/lib/direct-to-factory/validation';

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

    if (body?.factory_price !== undefined || body?.price_markup !== undefined || body?.profit_deduction !== undefined) {
      if (!isPrice(body?.factory_price) || !isPrice(body?.price_markup) || !isPrice(body?.profit_deduction)) {
        return NextResponse.json({ error: 'ราคาไม่ถูกต้อง' }, { status: 400 });
      }
      const factoryPrice = Number(String(body.factory_price).trim());
      const markup = Number(String(body.price_markup).trim());
      const deduction = Number(String(body.profit_deduction).trim());
      const price = offerPriceFromParts(factoryPrice, markup, deduction);
      if (price === null) {
        return NextResponse.json({ error: 'หักส่วนต่างมากกว่าราคาโรงงานบวกเพิ่ม' }, { status: 400 });
      }
      set('factory_price', factoryPrice);
      set('price_markup', markup);
      set('profit_deduction', deduction);
      set('price', price);
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
    if (body?.form_id !== undefined) {
      if (body.form_id !== null && !isUuid(body.form_id)) {
        return NextResponse.json({ error: 'แบบฟอร์มไม่ถูกต้อง' }, { status: 400 });
      }
      if (body.form_id) {
        const form = await queryOne<{ id: string }>('SELECT id FROM factory_forms WHERE id = $1', [body.form_id]);
        if (!form) return NextResponse.json({ error: 'ไม่พบแบบฟอร์ม' }, { status: 400 });
      }
      set('form_id', body.form_id);
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
