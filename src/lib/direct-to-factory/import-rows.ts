export interface ParsedOfferRow {
  line: number;
  factoryName: string;
  productName: string;
  agentName: string;
  price: number;
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

export const OFFER_SHEET_HEADERS = ['โรงงานปลายทาง', 'สินค้า', 'ชื่อตัวแทน', 'ราคาล่าสุด', 'เลข PO', 'เลขใบนำส่ง', 'ชื่อแบบฟอร์ม'] as const;

const COLUMNS = {
  factoryName: OFFER_SHEET_HEADERS[0],
  productName: OFFER_SHEET_HEADERS[1],
  agentName: OFFER_SHEET_HEADERS[2],
  price: OFFER_SHEET_HEADERS[3],
  poNumber: OFFER_SHEET_HEADERS[4],
  deliveryNoteNumber: OFFER_SHEET_HEADERS[5],
  formName: OFFER_SHEET_HEADERS[6],
} as const;

export interface OfferSheetSource {
  factoryName: string;
  productName: string;
  agentName: string;
  price: string;
  poNumber: string | null;
  deliveryNoteNumber: string | null;
  formName: string | null;
}

/** Header plus one row per offer. Blank PO or delivery note stays blank so a re-import keeps the stored value. */
export function offerSheetRows(offers: OfferSheetSource[]): string[][] {
  return [
    [...OFFER_SHEET_HEADERS],
    ...offers.map((offer) => [
      offer.factoryName,
      offer.productName,
      offer.agentName,
      offer.price,
      offer.poNumber ?? '',
      offer.deliveryNoteNumber ?? '',
      offer.formName ?? '',
    ]),
  ];
}

const REQUIRED: (keyof typeof COLUMNS)[] = ['factoryName', 'productName', 'agentName', 'price'];

const PRICE_PATTERN = /^\d+(\.\d+)?$/;

/** rows[0] is the header row; line numbers match the spreadsheet (header = line 1). */
export function parseOfferRows(rows: string[][]): { rows: ParsedOfferRow[]; errors: ImportRowError[] } {
  const header = (rows[0] ?? []).map((cell) => String(cell ?? '').trim());
  const index = Object.fromEntries(
    Object.entries(COLUMNS).map(([key, title]) => [key, header.indexOf(title)])
  ) as Record<keyof typeof COLUMNS, number>;

  const missing = REQUIRED.filter((key) => index[key] === -1).map((key) => COLUMNS[key]);
  if (missing.length > 0) {
    return { rows: [], errors: [{ line: 1, message: `ไม่พบคอลัมน์: ${missing.join(', ')}` }] };
  }

  const parsed: ParsedOfferRow[] = [];
  const errors: ImportRowError[] = [];
  const seen = new Map<string, number>();

  rows.slice(1).forEach((rawRow, offset) => {
    const line = offset + 2;
    const cell = (key: keyof typeof COLUMNS) =>
      index[key] === -1 ? '' : String(rawRow[index[key]] ?? '').trim();

    if (rawRow.every((value) => String(value ?? '').trim() === '')) return;

    const emptyRequired = REQUIRED.find((key) => cell(key) === '');
    if (emptyRequired) {
      errors.push({ line, message: `ต้องระบุ ${COLUMNS[emptyRequired]}` });
      return;
    }

    const priceText = cell('price');
    const normalizedPrice = priceText.replace(/,/g, '');
    if (!PRICE_PATTERN.test(normalizedPrice)) {
      errors.push({ line, message: `ราคาไม่ถูกต้อง: ${priceText}` });
      return;
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
      price: Number(normalizedPrice),
      poNumber: cell('poNumber') || null,
      deliveryNoteNumber: cell('deliveryNoteNumber') || null,
      formName: cell('formName') || null,
    });
  });

  return { rows: parsed, errors };
}
