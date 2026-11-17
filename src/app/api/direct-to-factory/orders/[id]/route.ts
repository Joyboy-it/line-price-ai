import { NextRequest, NextResponse } from 'next/server';
import { logActionWithIp } from '@/lib/log-helper';
import { requireCustomer } from '@/lib/direct-to-factory/customer-access';
import { canCustomerCancel, canCustomerEdit, toCustomerView } from '@/lib/direct-to-factory/order-rules';
import {
  cancelCustomerOrder,
  getCustomerOrder,
  getOffersForProduct,
  getOrderFiles,
  isProductAvailable,
  offerSnapshot,
  updateCustomerOrder,
} from '@/lib/direct-to-factory/queries';
import { selectBestOffer } from '@/lib/direct-to-factory/select-offer';
import { isUuid, parseCustomerOrderInput } from '@/lib/direct-to-factory/validation';

type Params = { params: Promise<{ id: string }> };

const NOT_FOUND = () => NextResponse.json({ error: 'ไม่พบรายการ' }, { status: 404 });
const LOCKED = () =>
  NextResponse.json({ error: 'เจ้าหน้าที่ยืนยันรายการนี้แล้ว จึงแก้ไขหรือยกเลิกไม่ได้' }, { status: 409 });

export async function GET(_request: NextRequest, { params }: Params) {
  const guard = await requireCustomer('view');
  if (guard.error) return guard.error;

  const { id } = await params;
  if (!isUuid(id)) return NOT_FOUND();

  try {
    const order = await getCustomerOrder(id, guard.session.user.id);
    if (!order) return NOT_FOUND();
    return NextResponse.json(toCustomerView(order, await getOrderFiles(id)));
  } catch (error) {
    console.error('Error fetching factory order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const guard = await requireCustomer('view');
  if (guard.error) return guard.error;

  const { id } = await params;
  if (!isUuid(id)) return NOT_FOUND();
  const userId = guard.session.user.id;

  try {
    const existing = await getCustomerOrder(id, userId);
    if (!existing) return NOT_FOUND();
    if (!canCustomerEdit(existing)) return LOCKED();

    const parsed = parseCustomerOrderInput(await request.json().catch(() => null));
    if (parsed.errors) {
      return NextResponse.json({ error: 'กรุณาตรวจสอบข้อมูล', fields: parsed.errors }, { status: 400 });
    }
    const input = parsed.value;

    const productChanged = input.productId !== existing.product_id || input.factoryId !== existing.factory_id;
    let snapshot = null;
    if (productChanged) {
      const best = (await isProductAvailable(input.factoryId, input.productId))
        ? selectBestOffer(await getOffersForProduct(input.productId))
        : null;
      if (!best) {
        return NextResponse.json(
          { error: 'สินค้านี้ยังไม่เปิดรับ', fields: { product_id: 'สินค้านี้ยังไม่เปิดรับที่โรงงานนี้' } },
          { status: 400 }
        );
      }
      snapshot = offerSnapshot(best);
    }

    if (!(await updateCustomerOrder(id, userId, input, snapshot))) return LOCKED();

    await logActionWithIp(request, userId, 'update_factory_order', 'factory_order', id, {
      by: 'customer',
      product_changed: productChanged,
    });

    const order = await getCustomerOrder(id, userId);
    return NextResponse.json(toCustomerView(order!, await getOrderFiles(id)));
  } catch (error) {
    console.error('Error updating factory order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** Cancels the order; the row is kept for history. */
export async function DELETE(request: NextRequest, { params }: Params) {
  const guard = await requireCustomer('view');
  if (guard.error) return guard.error;

  const { id } = await params;
  if (!isUuid(id)) return NOT_FOUND();
  const userId = guard.session.user.id;

  try {
    const existing = await getCustomerOrder(id, userId);
    if (!existing) return NOT_FOUND();
    if (!canCustomerCancel(existing)) {
      return NextResponse.json({ error: 'รายการนี้มีการดำเนินการแล้ว จึงยกเลิกไม่ได้' }, { status: 409 });
    }
    if (!(await cancelCustomerOrder(id, userId))) return LOCKED();

    await logActionWithIp(request, userId, 'cancel_factory_order', 'factory_order', id, { by: 'customer' });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling factory order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
