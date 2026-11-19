import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { parseOfferRows, writeOfferSheet } from '@/lib/direct-to-factory/import-rows';
import { readSpreadsheet } from '@/lib/direct-to-factory/read-spreadsheet';

describe('writeOfferSheet', () => {
  it('stores the latest price as a formula and import recalculates it', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('ราคา');
    writeOfferSheet(sheet, [
      {
        factoryName: 'Prime',
        productName: 'สแตนเลส SUS 201',
        agentName: '1',
        factoryPrice: '10',
        priceMarkup: '2',
        profitDeduction: '1',
        poNumber: 'PO-1',
        deliveryNoteNumber: 'DN-1',
        formName: 'ฟอร์ม Prime',
      },
    ]);

    expect(sheet.getCell('G2').formula).toBe('D2+E2-F2');
    expect(sheet.getCell('G2').result).toBe(11);

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const parsed = parseOfferRows(await readSpreadsheet(buffer, 'ราคาตัวแทน.xlsx'));

    expect(parsed.errors).toEqual([]);
    expect(parsed.rows[0]).toMatchObject({
      factoryName: 'Prime',
      productName: 'สแตนเลส SUS 201',
      agentName: '1',
      price: 11,
      factoryPrice: 10,
      priceMarkup: 2,
      profitDeduction: 1,
      poNumber: 'PO-1',
      deliveryNoteNumber: 'DN-1',
      formName: 'ฟอร์ม Prime',
    });
  });

  it('writes only the header when there are no offers', () => {
    const sheet = new ExcelJS.Workbook().addWorksheet('ราคา');
    writeOfferSheet(sheet, []);
    expect(sheet.getRow(1).values).toEqual([
      undefined,
      'โรงงานปลายทาง',
      'สินค้า',
      'ชื่อตัวแทน',
      'ราคาโรงงาน',
      'ราคาบวกเพิ่ม',
      'หักส่วนต่างกำไร',
      'ราคาล่าสุด',
      'เลข PO',
      'เลขใบนำส่ง',
      'ชื่อแบบฟอร์ม',
    ]);
  });
});
