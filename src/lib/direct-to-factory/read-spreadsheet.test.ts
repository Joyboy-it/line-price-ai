import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { readSpreadsheet } from '@/lib/direct-to-factory/read-spreadsheet';

const HEADER = ['โรงงานปลายทาง', 'สินค้า', 'ชื่อตัวแทน', 'ราคาล่าสุด', 'เลข PO'];

describe('readSpreadsheet', () => {
  it('reads the first sheet of an .xlsx file as text rows', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('ราคา');
    sheet.addRow(HEADER);
    sheet.addRow(['Prime', 'สแตนเลส SUS 201', 1, 9.73, 'PO-1']);
    workbook.addWorksheet('อื่น').addRow(['ไม่ใช้']);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const rows = await readSpreadsheet(buffer, 'prices.xlsx');

    expect(rows).toEqual([HEADER, ['Prime', 'สแตนเลส SUS 201', '1', '9.73', 'PO-1']]);
  });

  it('reads a UTF-8 .csv with a BOM and keeps values as typed', async () => {
    const csv = '\uFEFF' + HEADER.join(',') + '\r\nPrime,สแตนเลส SUS 202,2,9.79,00123\r\n';

    const rows = await readSpreadsheet(Buffer.from(csv, 'utf8'), 'prices.CSV');

    expect(rows).toEqual([HEADER, ['Prime', 'สแตนเลส SUS 202', '2', '9.79', '00123']]);
  });

  it('rejects other file types', async () => {
    await expect(readSpreadsheet(Buffer.from('x'), 'prices.pdf')).rejects.toThrow('รองรับเฉพาะไฟล์ .xlsx หรือ .csv');
  });
});
