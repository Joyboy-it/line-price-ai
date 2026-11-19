import { describe, expect, it } from 'vitest';
import { parseOfferRows } from '@/lib/direct-to-factory/import-rows';

const HEADER = ['โรงงานปลายทาง', 'สินค้า', 'ชื่อตัวแทน', 'ราคาล่าสุด', 'เลข PO', 'เลขใบนำส่ง', 'ไฟล์ดาวโหลดแบบฟอร์ม'];

describe('parseOfferRows', () => {
  it('reads rows in the layout of the daily price sheet', () => {
    const result = parseOfferRows([
      HEADER,
      ['Prime', 'สแตนเลส SUS 201', '1', '9.00', '', '', ''],
      ['Prime', 'สแตนเลส SUS 201', '2', '9.73', 'PO-1', 'DN-1', 'ignored'],
    ]);

    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([
      { line: 2, factoryName: 'Prime', productName: 'สแตนเลส SUS 201', agentName: '1', price: 9, factoryPrice: 9, priceMarkup: 0, profitDeduction: 0, poNumber: null, deliveryNoteNumber: null, formName: null },
      { line: 3, factoryName: 'Prime', productName: 'สแตนเลส SUS 201', agentName: '2', price: 9.73, factoryPrice: 9.73, priceMarkup: 0, profitDeduction: 0, poNumber: 'PO-1', deliveryNoteNumber: 'DN-1', formName: null },
    ]);
  });

  it('accepts files without the PO and delivery note columns, in any column order', () => {
    const result = parseOfferRows([
      ['ราคาล่าสุด', 'ชื่อตัวแทน', 'สินค้า', 'โรงงานปลายทาง'],
      ['1,234.50', ' 1 ', ' SUS 202 ', ' Prime '],
    ]);

    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([
      { line: 2, factoryName: 'Prime', productName: 'SUS 202', agentName: '1', price: 1234.5, factoryPrice: 1234.5, priceMarkup: 0, profitDeduction: 0, poNumber: null, deliveryNoteNumber: null, formName: null },
    ]);
  });

  it('skips blank rows but keeps the original line numbers', () => {
    const result = parseOfferRows([HEADER, ['', '', '', ''], ['Prime', 'SUS 203', '1', '9.5']]);

    expect(result.rows.map((r) => r.line)).toEqual([3]);
  });

  it('reports a missing required header', () => {
    const result = parseOfferRows([['โรงงานปลายทาง', 'สินค้า', 'ราคาล่าสุด'], ['Prime', 'SUS 201', '9']]);

    expect(result.rows).toEqual([]);
    expect(result.errors).toEqual([{ line: 1, message: 'ไม่พบคอลัมน์: ชื่อตัวแทน' }]);
  });

  it('rejects missing values, bad prices and negative prices with their line numbers', () => {
    const result = parseOfferRows([
      HEADER,
      ['Prime', '', '1', '9'],
      ['Prime', 'SUS 201', '1', 'abc'],
      ['Prime', 'SUS 202', '1', '-1'],
      ['Prime', 'SUS 203', '1', ''],
    ]);

    expect(result.errors).toEqual([
      { line: 2, message: 'ต้องระบุ สินค้า' },
      { line: 3, message: 'ราคาไม่ถูกต้อง: abc' },
      { line: 4, message: 'ราคาไม่ถูกต้อง: -1' },
      { line: 5, message: 'ต้องระบุ ราคาล่าสุด' },
    ]);
  });

  it('recalculates the decision price from the three price columns and ignores a typed latest price', () => {
    const result = parseOfferRows([
      ['โรงงานปลายทาง', 'สินค้า', 'ชื่อตัวแทน', 'ราคาโรงงาน', 'ราคาบวกเพิ่ม', 'หักส่วนต่างกำไร', 'ราคาล่าสุด'],
      ['Prime', 'SUS 201', '1', '10', '2', '1', '99'],
    ]);

    expect(result.errors).toEqual([]);
    expect(result.rows[0]).toMatchObject({ price: 11, factoryPrice: 10, priceMarkup: 2, profitDeduction: 1 });
  });

  it('rejects a deduction larger than factory price plus markup', () => {
    const result = parseOfferRows([
      ['โรงงานปลายทาง', 'สินค้า', 'ชื่อตัวแทน', 'ราคาโรงงาน', 'ราคาบวกเพิ่ม', 'หักส่วนต่างกำไร'],
      ['Prime', 'SUS 201', '1', '10', '2', '13'],
    ]);

    expect(result.errors).toEqual([{ line: 2, message: 'หักส่วนต่างมากกว่าราคาโรงงานบวกเพิ่ม' }]);
  });

  it('reports the same factory + product + agent appearing twice', () => {
    const result = parseOfferRows([
      HEADER,
      ['Prime', 'SUS 201', '1', '9'],
      ['Prime', 'SUS 201', '1', '9.1'],
    ]);

    expect(result.errors).toEqual([{ line: 3, message: 'ซ้ำกับแถวที่ 2 (Prime / SUS 201 / 1)' }]);
  });
});
