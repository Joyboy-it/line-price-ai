import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/direct-to-factory/customer-access';
import { writeOfferSheet } from '@/lib/direct-to-factory/import-rows';
import { listOffers } from '@/lib/direct-to-factory/queries';

const FILE_NAME = 'ราคาตัวแทน.xlsx';

export async function GET() {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  try {
    const offers = await listOffers();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('ราคา');
    writeOfferSheet(sheet, offers.map((offer) => ({
      factoryName: offer.factory_name,
      productName: offer.product_name,
      agentName: offer.agent_name,
      factoryPrice: offer.factory_price,
      priceMarkup: offer.price_markup,
      profitDeduction: offer.profit_deduction,
      oldPrice: offer.old_price,
      poNumber: offer.po_number,
      deliveryNoteNumber: offer.delivery_note_number,
      formName: offer.form_name,
    })));
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="agent-prices.xlsx"; filename*=UTF-8''${encodeURIComponent(FILE_NAME)}`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error exporting offers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
