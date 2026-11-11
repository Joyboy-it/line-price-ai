import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { logActionWithIp } from '@/lib/log-helper';
import { requireStaff } from '@/lib/direct-to-factory/customer-access';
import { isOrderStatus } from '@/lib/direct-to-factory/order-rules';
import { getOffersForProduct, getOrder, getOrderFiles } from '@/lib/direct-to-factory/queries';
import { cleanText, isIsoDate, isPrice, isTime, isUuid } from '@/lib/direct-to-factory/validation';

type Params = { params: Promise<{ id: string }> };

const NOT_FOUND = () => NextResponse.json({ error: 'ไม่พบรายการ' }, { status: 404 });
const bad = (message: string) => NextResponse.json({ error: message }, { status: 400 });

export async function GET(_request: NextRequest, { params }: Params) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  const { id } = await params;
  if (!isUuid(id)) return NOT_FOUND();

  try {
    const order = await getOrder(id);
    if (!order) return NOT_FOUND();
    return NextResponse.json({ order, files: await getOrderFiles(id) });
  } catch (error) {
    console.error('Error fetching staff order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const emptyToNull = (value: unknown) => (value === '' ? null : value);

export async function PATCH(request: NextRequest, { params }: Params) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  const { id } = await params;
  if (!isUuid(id)) return NOT_FOUND();

  try {
    const existing = await getOrder(id);
    if (!existing) return NOT_FOUND();
    if (existing.status === 'cancelled') {
      return NextResponse.json({ error: 'รายการนี้ถูกยกเลิกแล้ว' }, { status: 409 });
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return bad('ข้อมูลไม่ถูกต้อง');

    const sets: string[] = [];
    const values: unknown[] = [];
    const changed: string[] = [];
    const set = (column: string, value: unknown) => {
      values.push(value);
      sets.push(`${column} = $${values.length}`);
      changed.push(column);
    };

    if ('confirmed_date' in body) {
      const value = emptyToNull(body.confirmed_date);
      if (value !== null && !isIsoDate(value)) return bad('วันที่ยืนยันไม่ถูกต้อง');
      set('confirmed_date', value);
    }
    if ('delivery_time' in body) {
      const value = emptyToNull(body.delivery_time);
      if (value !== null && !isTime(value)) return bad('เวลานำส่งไม่ถูกต้อง');
      set('delivery_time', value);
    }

    let confirmedFactoryId = existing.confirmed_factory_id;
    let confirmedProductId = existing.confirmed_product_id;
    if ('confirmed_factory_id' in body) {
      const value = emptyToNull(body.confirmed_factory_id);
      if (value !== null && !isUuid(value)) return bad('โรงงานไม่ถูกต้อง');
      confirmedFactoryId = value as string | null;
      set('confirmed_factory_id', value);
    }
    if ('confirmed_product_id' in body) {
      const value = emptyToNull(body.confirmed_product_id);
      if (value !== null && !isUuid(value)) return bad('สินค้าไม่ถูกต้อง');
      confirmedProductId = value as string | null;
      set('confirmed_product_id', value);
    }
    if (confirmedProductId) {
      const match = await queryOne<{ id: string }>(
        'SELECT id FROM factory_products WHERE id = $1 AND factory_id = $2',
        [confirmedProductId, confirmedFactoryId ?? existing.factory_id]
      );
      if (!match) return bad('สินค้าที่ยืนยันไม่ได้อยู่ในโรงงานที่เลือก');
    }

    if ('offer_id' in body && emptyToNull(body.offer_id) !== existing.offer_id) {
      const offerId = emptyToNull(body.offer_id);
      if (offerId === null) {
        for (const column of ['offer_id', 'agent_id', 'form_file_path', 'form_file_name', 'form_mime_type']) set(column, null);
      } else {
        if (!isUuid(offerId)) return bad('ตัวแทนไม่ถูกต้อง');
        const offer = (await getOffersForProduct(confirmedProductId ?? existing.product_id)).find((o) => o.offerId === offerId);
        if (!offer) return bad('ตัวแทนนี้ไม่มีข้อเสนอสำหรับสินค้านี้');
        set('offer_id', offer.offerId);
        set('agent_id', offer.agentId);
        set('form_file_path', offer.formFilePath);
        set('form_file_name', offer.formFileName);
        set('form_mime_type', offer.formMimeType);
      }
    }

    if ('price' in body) {
      const value = emptyToNull(body.price);
      if (value !== null && !isPrice(value)) return bad('ราคาไม่ถูกต้อง');
      set('price', value === null ? null : String(value).trim());
    }
    for (const column of ['po_number', 'delivery_note_number', 'staff_note'] as const) {
      if (column in body) {
        const value = cleanText(body[column], column === 'staff_note' ? 1000 : 200);
        if (value === undefined) return bad('ข้อความยาวเกินไป');
        set(column, value);
      }
    }
    if ('status' in body) {
      if (!isOrderStatus(body.status) || body.status === 'cancelled') return bad('สถานะไม่ถูกต้อง');
      set('status', body.status);
    }

    if (sets.length === 0) return bad('ไม่มีข้อมูลที่จะแก้ไข');

    values.push(guard.session.user.id);
    sets.push(`updated_by = $${values.length}`);
    values.push(id);
    await queryOne(`UPDATE factory_orders SET ${sets.join(', ')} WHERE id = $${values.length}`, values);

    await logActionWithIp(request, guard.session.user.id, 'update_factory_order', 'factory_order', id, {
      by: 'staff',
      fields: changed,
      status: body.status,
    });

    return NextResponse.json({ order: await getOrder(id), files: await getOrderFiles(id) });
  } catch (error) {
    console.error('Error updating staff order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
