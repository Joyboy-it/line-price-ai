import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { offerSheetRows, parseOfferRows } from '@/lib/direct-to-factory/import-rows';
import { readSpreadsheet } from '@/lib/direct-to-factory/read-spreadsheet';

describe('offerSheetRows', () => {
  it('round-trips current offers through an xlsx file the importer accepts', async () => {
    const rows = offerSheetRows([
      {
        factoryName: 'Prime',
        productName: 'สแตนเลส SUS 201',
        agentName: '1',
        price: '9.00',
        poNumber: 'PO-1',
        deliveryNoteNumber: 'DN-1',
        formName: 'ฟอร์ม Prime',
      },
      {
        factoryName: 'Prime',
        productName: 'สแตนเลส SUS 202',
        agentName: '2',
        price: '12.50',
        poNumber: null,
        deliveryNoteNumber: null,
        formName: null,
      },
    ]);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('ราคา');
    for (const row of rows) sheet.addRow(row);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const parsed = parseOfferRows(await readSpreadsheet(buffer, 'ราคาตัวแทน.xlsx'));

    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toEqual([
      {
        line: 2,
        factoryName: 'Prime',
        productName: 'สแตนเลส SUS 201',
        agentName: '1',
        price: 9,
        poNumber: 'PO-1',
        deliveryNoteNumber: 'DN-1',
        formName: 'ฟอร์ม Prime',
      },
      {
        line: 3,
        factoryName: 'Prime',
        productName: 'สแตนเลส SUS 202',
        agentName: '2',
        price: 12.5,
        poNumber: null,
        deliveryNoteNumber: null,
        formName: null,
      },
    ]);
  });

  it('writes only the header when there are no offers', () => {
    expect(offerSheetRows([])).toEqual([['โรงงานปลายทาง', 'สินค้า', 'ชื่อตัวแทน', 'ราคาล่าสุด', 'เลข PO', 'เลขใบนำส่ง', 'ชื่อแบบฟอร์ม']]);
  });
});
