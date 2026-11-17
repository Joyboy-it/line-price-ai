import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/direct-to-factory/customer-access';
import { offerSheetRows } from '@/lib/direct-to-factory/import-rows';
import { listOffers } from '@/lib/direct-to-factory/queries';

const FILE_NAME = 'ราคาตัวแทน.xlsx';

export async function GET() {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  try {
    const offers = await listOffers();
    const rows = offerSheetRows(
      offers.map((offer) => ({
        factoryName: offer.factory_name,
        productName: offer.product_name,
        agentName: offer.agent_name,
        price: offer.price,
        poNumber: offer.po_number,
        deliveryNoteNumber: offer.delivery_note_number,
        formName: offer.form_name,
      }))
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('ราคา');
    for (const row of rows) sheet.addRow(row);
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
