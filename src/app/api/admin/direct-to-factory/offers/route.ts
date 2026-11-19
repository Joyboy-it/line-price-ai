import { NextRequest, NextResponse } from 'next/server';
import { transaction } from '@/lib/db';
import { logActionWithIp } from '@/lib/log-helper';
import { requireStaff } from '@/lib/direct-to-factory/customer-access';
import { getOffersForProduct, listOffers, upsertOffer } from '@/lib/direct-to-factory/queries';
import { cleanText, isPrice, isUuid, offerPriceFromParts } from '@/lib/direct-to-factory/validation';

export async function GET(request: NextRequest) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  const factoryId = request.nextUrl.searchParams.get('factory_id') || undefined;
  const productId = request.nextUrl.searchParams.get('product_id') || undefined;
  if ((factoryId && !isUuid(factoryId)) || (productId && !isUuid(productId))) {
    return NextResponse.json([]);
  }

  try {
    if (productId) {
      return NextResponse.json(await getOffersForProduct(productId));
    }
    return NextResponse.json(await listOffers(factoryId));
  } catch (error) {
    console.error('Error listing offers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** Adds (or updates) a single offer by factory, product and agent name. */
export async function POST(request: NextRequest) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  try {
    const body = await request.json();
    const factoryName = cleanText(body?.factory_name, 200);
    const productName = cleanText(body?.product_name, 200);
    const agentName = cleanText(body?.agent_name, 200);
    const poNumber = cleanText(body?.po_number, 200);
    const deliveryNoteNumber = cleanText(body?.delivery_note_number, 200);

    if (!factoryName || !productName || !agentName) {
      return NextResponse.json({ error: 'ต้องระบุโรงงาน สินค้า และตัวแทน' }, { status: 400 });
    }
    if (!isPrice(body?.factory_price) || !isPrice(body?.price_markup) || !isPrice(body?.profit_deduction)) {
      return NextResponse.json({ error: 'ราคาไม่ถูกต้อง' }, { status: 400 });
    }
    const price = offerPriceFromParts(
      Number(String(body.factory_price).trim()),
      Number(String(body.price_markup).trim()),
      Number(String(body.profit_deduction).trim())
    );
    if (price === null) {
      return NextResponse.json({ error: 'หักส่วนต่างมากกว่าราคาโรงงานบวกเพิ่ม' }, { status: 400 });
    }
    if (poNumber === undefined || deliveryNoteNumber === undefined) {
      return NextResponse.json({ error: 'เลข PO หรือเลขใบนำส่งยาวเกินไป' }, { status: 400 });
    }

    const result = await transaction((client) =>
      upsertOffer(client, {
        factoryName,
        productName,
        agentName,
        price,
        factoryPrice: Number(String(body.factory_price).trim()),
        priceMarkup: Number(String(body.price_markup).trim()),
        profitDeduction: Number(String(body.profit_deduction).trim()),
        poNumber,
        deliveryNoteNumber,
        formName: null,
      })
    );

    await logActionWithIp(request, guard.session.user.id, 'update_factory_settings', 'agent_offer', result.id, {
      action: result.inserted ? 'create' : 'update',
      factory: factoryName,
      product: productName,
      agent: agentName,
      price,
    });

    return NextResponse.json(result, { status: result.inserted ? 201 : 200 });
  } catch (error) {
    console.error('Error saving offer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
