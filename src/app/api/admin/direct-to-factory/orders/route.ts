import { NextRequest, NextResponse } from 'next/server';
import { logActionWithIp } from '@/lib/log-helper';
import { hasFactoryAccess, requireStaff } from '@/lib/direct-to-factory/customer-access';
import {
  getOffersForProduct,
  insertCustomerOrder,
  isProductAvailable,
  listStaffOrders,
  offerSnapshot,
  STAFF_PAGE_SIZE,
} from '@/lib/direct-to-factory/queries';
import { selectBestOffer } from '@/lib/direct-to-factory/select-offer';
import { parseStaffOrderFilters, parseStaffOrderInput, staffCreateOrderRefusal } from '@/lib/direct-to-factory/validation';

export async function GET(request: NextRequest) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  try {
    const filters = parseStaffOrderFilters((key) => request.nextUrl.searchParams.get(key));
    const result = await listStaffOrders(filters);
    return NextResponse.json({ ...result, page: filters.page, pageSize: STAFF_PAGE_SIZE });
  } catch (error) {
    console.error('Error listing staff orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  try {
    const parsed = parseStaffOrderInput(await request.json().catch(() => null));
    if (parsed.errors) {
      return NextResponse.json({ error: 'กรุณาตรวจสอบข้อมูล', fields: parsed.errors }, { status: 400 });
    }
    const input = parsed.value;

    const [eligible, productAvailable, offers] = await Promise.all([
      hasFactoryAccess(input.userId, 'view'),
      isProductAvailable(input.factoryId, input.productId),
      getOffersForProduct(input.productId),
    ]);
    const best = selectBestOffer(offers);
    const refusal = staffCreateOrderRefusal({ eligible, productAvailable, hasOffer: best !== null });
    if (refusal || !best) {
      return NextResponse.json(
        refusal ?? { error: 'สินค้านี้ยังไม่เปิดรับ', fields: { product_id: 'สินค้านี้ยังไม่เปิดรับที่โรงงานนี้' } },
        { status: 400 }
      );
    }

    const orderId = await insertCustomerOrder(input.userId, input, offerSnapshot(best));
    await logActionWithIp(request, guard.session.user.id, 'create_factory_order', 'factory_order', orderId, {
      by: 'staff',
      customer_user_id: input.userId,
      factory_id: input.factoryId,
      product_id: input.productId,
      delivery_date: input.deliveryDate,
    });
    return NextResponse.json({ id: orderId }, { status: 201 });
  } catch (error) {
    console.error('Error creating staff factory order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
