import type ExcelJS from 'exceljs';
import { offerPriceFromParts } from '@/lib/direct-to-factory/validation';

export interface ParsedOfferRow {
  line: number;
  factoryName: string;
  productName: string;
  agentName: string;
  price: number;
  factoryPrice: number;
  priceMarkup: number;
  profitDeduction: number;
  /** null = keep the value already stored */
  poNumber: string | null;
  /** null = keep the value already stored */
  deliveryNoteNumber: string | null;
  /** null = keep the form already linked */
  formName: string | null;
}

export interface ImportRowError {
  line: number;
  message: string;
}

export const OFFER_SHEET_HEADERS = [
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
] as const;

const COLUMNS = {
  factoryName: 'โรงงานปลายทาง',
  productName: 'สินค้า',
  agentName: 'ชื่อตัวแทน',
  factoryPrice: 'ราคาโรงงาน',
  priceMarkup: 'ราคาบวกเพิ่ม',
  profitDeduction: 'หักส่วนต่างกำไร',
  price: 'ราคาล่าสุด',
  poNumber: 'เลข PO',
  deliveryNoteNumber: 'เลขใบนำส่ง',
  formName: 'ชื่อแบบฟอร์ม',
} as const;

const PART_KEYS = ['factoryPrice', 'priceMarkup', 'profitDeduction'] as const;

export interface OfferSheetSource {
  factoryName: string;
  productName: string;
  agentName: string;
  factoryPrice: string;
  priceMarkup: string;
  profitDeduction: string;
  poNumber: string | null;
  deliveryNoteNumber: string | null;
  formName: string | null;
}

const PRICE_PATTERN = /^\d+(\.\d+)?$/;

function priceNumber(value: string): number | null {
  const normalized = value.replace(/,/g, '');
  return PRICE_PATTERN.test(normalized) ? Number(normalized) : null;
}

/** Writes the offer sheet. Latest price is a formula so editing the three parts cannot leave a stale total. */
export function writeOfferSheet(sheet: ExcelJS.Worksheet, offers: OfferSheetSource[]): void {
  sheet.addRow([...OFFER_SHEET_HEADERS]);
  offers.forEach((offer, index) => {
    const rowNumber = index + 2;
    const factoryPrice = Number(offer.factoryPrice);
    const markup = Number(offer.priceMarkup);
    const deduction = Number(offer.profitDeduction);
    const row = sheet.addRow([
      offer.factoryName,
      offer.productName,
      offer.agentName,
      factoryPrice,
      markup,
      deduction,
      null,
      offer.poNumber ?? '',
      offer.deliveryNoteNumber ?? '',
      offer.formName ?? '',
    ]);
    row.getCell(7).value = {
      formula: `D${rowNumber}+E${rowNumber}-F${rowNumber}`,
      result: offerPriceFromParts(factoryPrice, markup, deduction) ?? 0,
    };
  });
}

/** rows[0] is the header row; line numbers match the spreadsheet (header = line 1). */
export function parseOfferRows(rows: string[][]): { rows: ParsedOfferRow[]; errors: ImportRowError[] } {
  const header = (rows[0] ?? []).map((cell) => String(cell ?? '').trim());
  const index = Object.fromEntries(
    Object.entries(COLUMNS).map(([key, title]) => [key, header.indexOf(title)])
  ) as Record<keyof typeof COLUMNS, number>;

  const hasParts = PART_KEYS.some((key) => index[key] !== -1);
  const missing = (['factoryName', 'productName', 'agentName'] as const)
    .filter((key) => index[key] === -1)
    .map((key) => COLUMNS[key]);
  if (hasParts) {
    for (const key of PART_KEYS) {
      if (index[key] === -1) missing.push(COLUMNS[key]);
    }
  } else if (index.price === -1) {
    missing.push(COLUMNS.price);
  }
  if (missing.length > 0) {
    return { rows: [], errors: [{ line: 1, message: `ไม่พบคอลัมน์: ${missing.join(', ')}` }] };
  }

  const parsed: ParsedOfferRow[] = [];
  const errors: ImportRowError[] = [];
  const seen = new Map<string, number>();
  const required = hasParts
    ? (['factoryName', 'productName', 'agentName', ...PART_KEYS] as const)
    : (['factoryName', 'productName', 'agentName', 'price'] as const);

  rows.slice(1).forEach((rawRow, offset) => {
    const line = offset + 2;
    const cell = (key: keyof typeof COLUMNS) =>
      index[key] === -1 ? '' : String(rawRow[index[key]] ?? '').trim();

    if (rawRow.every((value) => String(value ?? '').trim() === '')) return;

    const emptyRequired = required.find((key) => cell(key) === '');
    if (emptyRequired) {
      errors.push({ line, message: `ต้องระบุ ${COLUMNS[emptyRequired]}` });
      return;
    }

    let price: number;
    let factoryPrice: number;
    let priceMarkup: number;
    let profitDeduction: number;

    if (hasParts) {
      const parts = {
        factoryPrice: priceNumber(cell('factoryPrice')),
        priceMarkup: priceNumber(cell('priceMarkup')),
        profitDeduction: priceNumber(cell('profitDeduction')),
      };
      const invalid = (Object.keys(parts) as (keyof typeof parts)[]).find((key) => parts[key] === null);
      if (invalid) {
        errors.push({ line, message: `ราคาไม่ถูกต้อง: ${cell(invalid)}` });
        return;
      }
      factoryPrice = parts.factoryPrice as number;
      priceMarkup = parts.priceMarkup as number;
      profitDeduction = parts.profitDeduction as number;
      const calculated = offerPriceFromParts(factoryPrice, priceMarkup, profitDeduction);
      if (calculated === null) {
        errors.push({ line, message: 'หักส่วนต่างมากกว่าราคาโรงงานบวกเพิ่ม' });
        return;
      }
      price = calculated;
    } else {
      const normalizedPrice = priceNumber(cell('price'));
      if (normalizedPrice === null) {
        errors.push({ line, message: `ราคาไม่ถูกต้อง: ${cell('price')}` });
        return;
      }
      price = normalizedPrice;
      factoryPrice = normalizedPrice;
      priceMarkup = 0;
      profitDeduction = 0;
    }

    const factoryName = cell('factoryName');
    const productName = cell('productName');
    const agentName = cell('agentName');
    const key = `${factoryName}\u0000${productName}\u0000${agentName}`;
    const firstLine = seen.get(key);
    if (firstLine !== undefined) {
      errors.push({ line, message: `ซ้ำกับแถวที่ ${firstLine} (${factoryName} / ${productName} / ${agentName})` });
      return;
    }
    seen.set(key, line);

    parsed.push({
      line,
      factoryName,
      productName,
      agentName,
      price,
      factoryPrice,
      priceMarkup,
      profitDeduction,
      poNumber: cell('poNumber') || null,
      deliveryNoteNumber: cell('deliveryNoteNumber') || null,
      formName: cell('formName') || null,
    });
  });

  return { rows: parsed, errors };
}
