import { cleanText, isIsoDate } from '@/lib/direct-to-factory/validation';

export const RECEIVE_PRODUCTS = ['large_battery', 'small_battery', 'other'] as const;
export type ReceiveProduct = (typeof RECEIVE_PRODUCTS)[number];

export const RECEIVE_PRODUCT_LABELS: Record<ReceiveProduct, string> = {
  large_battery: 'แบตเตอรี่ใหญ่',
  small_battery: 'แบตเตอรี่เล็ก',
  other: 'อื่นๆ',
};

export const RECEIVE_UNITS = ['piece', 'kilogram'] as const;
export type ReceiveUnit = (typeof RECEIVE_UNITS)[number];

export const RECEIVE_UNIT_LABELS: Record<ReceiveUnit, string> = {
  piece: 'ลูก',
  kilogram: 'กิโลกรัม',
};

export const RECEIVE_STATUSES = ['waiting', 'queued', 'completed'] as const;
export type ReceiveStatus = (typeof RECEIVE_STATUSES)[number];

export const RECEIVE_STATUS_LABELS: Record<ReceiveStatus, string> = {
  waiting: 'รอคิว',
  queued: 'จัดคิวแล้ว',
  completed: 'จบงาน',
};

export const RECEIVE_STATUS_ROW_CLASS: Record<ReceiveStatus, string> = {
  waiting: 'bg-amber-50 hover:bg-amber-100',
  queued: 'bg-sky-50 hover:bg-sky-100',
  completed: 'bg-green-50 hover:bg-green-100',
};

export interface ReceiveItem {
  product_type: string;
  quantity: number | string | null;
  unit: string | null;
}

export const RECEIVE_NOTICE_FIELDS = `
  n.id, n.queue_no, n.destination_name,
  to_char(n.created_at AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD') AS notified_date,
  to_char(n.receive_date, 'YYYY-MM-DD') AS planned_date,
  to_char(n.actual_receive_date, 'YYYY-MM-DD') AS actual_date,
  n.product_type, n.detail, n.note, n.staff_note, n.status,
  COALESCE(
    json_agg(
      json_build_object(
        'product_type', i.product_type,
        'quantity', i.quantity,
        'unit', i.unit
      ) ORDER BY i.sort_order
    ) FILTER (WHERE i.id IS NOT NULL),
    '[]'::json
  ) AS items`;

export interface ReceiveLineInput {
  product_type: ReceiveProduct;
  quantity: number;
  unit: ReceiveUnit;
}

export interface ReceiveSubmission {
  note: string | null;
  items: ReceiveLineInput[];
}

const MAX_LINES = 20;
const QUANTITY_PATTERN = /^(?:0|[1-9]\d{0,6})(?:\.\d{1,2})?$/;

export function isReceiveProduct(value: unknown): value is ReceiveProduct {
  return typeof value === 'string' && (RECEIVE_PRODUCTS as readonly string[]).includes(value);
}

export function isReceiveUnit(value: unknown): value is ReceiveUnit {
  return typeof value === 'string' && (RECEIVE_UNITS as readonly string[]).includes(value);
}

export function isReceiveStatus(value: unknown): value is ReceiveStatus {
  return typeof value === 'string' && (RECEIVE_STATUSES as readonly string[]).includes(value);
}

export function receiveProductLabel(type: string, detail: string | null = null): string {
  if (type === 'lead') return 'อื่นๆ';
  if (type === 'other') return detail?.trim() || 'อื่นๆ';
  if (isReceiveProduct(type)) return RECEIVE_PRODUCT_LABELS[type];
  return type;
}

export function formatReceiveQuantity(value: number | string): string {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return numeric.toFixed(2).replace(/\.?0+$/, '');
}

export function formatReceiveLine(item: ReceiveItem & { detail?: string | null }): string {
  const name = receiveProductLabel(item.product_type, item.detail ?? null);
  if (item.quantity == null || item.quantity === '' || !item.unit) return name;
  const unit = isReceiveUnit(item.unit) ? RECEIVE_UNIT_LABELS[item.unit] : item.unit;
  return `${name} ${formatReceiveQuantity(item.quantity)} ${unit}`;
}

export function formatReceiveNoticeItems(notice: {
  items: ReceiveItem[] | null;
  product_type: string | null;
  detail: string | null;
}): string {
  const items = Array.isArray(notice.items) ? notice.items : [];
  if (items.length === 0) {
    return notice.product_type ? receiveProductLabel(notice.product_type, notice.detail) : 'ไม่มีรายการสินค้า';
  }
  return items
    .map((item) => formatReceiveLine({
      ...item,
      detail: item.product_type === 'other' ? notice.detail : null,
    }))
    .join(', ');
}

export function parseOptionalDate(value: unknown): string | null | undefined {
  if (value === null || value === '') return null;
  if (!isIsoDate(value)) return undefined;
  return value;
}

export function parseReceiveSubmission(body: unknown): { value: ReceiveSubmission } | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'ข้อมูลไม่ถูกต้อง' };
  const record = body as Record<string, unknown>;
  const note = cleanText(record.note, 1000);
  if (note === undefined) return { error: 'หมายเหตุยาวเกินไป' };
  if (!Array.isArray(record.items) || record.items.length === 0) return { error: 'กรุณาเพิ่มรายการสินค้า' };
  if (record.items.length > MAX_LINES) return { error: 'เพิ่มได้ไม่เกิน 20 รายการ' };

  const items: ReceiveLineInput[] = [];
  for (const raw of record.items) {
    if (!raw || typeof raw !== 'object') return { error: 'รายการสินค้าไม่ถูกต้อง' };
    const line = raw as Record<string, unknown>;
    if (!isReceiveProduct(line.product_type)) return { error: 'กรุณาเลือกประเภทสินค้า' };
    const quantityText = typeof line.quantity === 'number' ? String(line.quantity) : typeof line.quantity === 'string' ? line.quantity.trim() : '';
    if (!QUANTITY_PATTERN.test(quantityText) || Number(quantityText) <= 0) return { error: 'กรุณากรอกจำนวนสินค้า' };
    if (!isReceiveUnit(line.unit)) return { error: 'กรุณาเลือกหน่วย' };
    items.push({ product_type: line.product_type, quantity: Number(quantityText), unit: line.unit });
  }

  return { value: { note, items } };
}
