import { NextRequest, NextResponse } from 'next/server';
import { logActionWithIp } from '@/lib/log-helper';
import { requireCustomer } from '@/lib/direct-to-factory/customer-access';
import { toCustomerView } from '@/lib/direct-to-factory/order-rules';
import {
  getCustomerOrder,
  getOffersForProduct,
  insertCustomerOrder,
  isProductAvailable,
  listCustomerOrders,
  offerSnapshot,
} from '@/lib/direct-to-factory/queries';
import { selectBestOffer } from '@/lib/direct-to-factory/select-offer';
import { parseCustomerOrderInput } from '@/lib/direct-to-factory/validation';

export async function GET() {
  const guard = await requireCustomer();
  if (guard.error) return guard.error;

  try {
    const orders = await listCustomerOrders(guard.session.user.id);
    return NextResponse.json(orders.map((order) => toCustomerView(order, [])));
  } catch (error) {
    console.error('Error listing customer orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireCustomer();
  if (guard.error) return guard.error;

  try {
    const parsed = parseCustomerOrderInput(await request.json().catch(() => null));
    if (parsed.errors) {
      return NextResponse.json({ error: 'กรุณาตรวจสอบข้อมูล', fields: parsed.errors }, { status: 400 });
    }
    const input = parsed.value;

    if (!(await isProductAvailable(input.factoryId, input.productId))) {
      return NextResponse.json(
        { error: 'สินค้านี้ยังไม่เปิดรับ', fields: { product_id: 'สินค้านี้ยังไม่เปิดรับที่โรงงานนี้' } },
        { status: 400 }
      );
    }

    const best = selectBestOffer(await getOffersForProduct(input.productId));
    if (!best) {
      return NextResponse.json(
        { error: 'สินค้านี้ยังไม่เปิดรับ', fields: { product_id: 'สินค้านี้ยังไม่เปิดรับที่โรงงานนี้' } },
        { status: 400 }
      );
    }

    const userId = guard.session.user.id;
    const orderId = await insertCustomerOrder(userId, input, offerSnapshot(best));

    await logActionWithIp(request, userId, 'create_factory_order', 'factory_order', orderId, {
      factory_id: input.factoryId,
      product_id: input.productId,
      delivery_date: input.deliveryDate,
    });

    const order = await getCustomerOrder(orderId, userId);
    return NextResponse.json(toCustomerView(order!, []), { status: 201 });
  } catch (error) {
    console.error('Error creating factory order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
