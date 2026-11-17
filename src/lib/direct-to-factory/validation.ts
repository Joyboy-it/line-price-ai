import { ORDER_STATUSES } from './order-rules';
import type { OrderStatus } from './types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const PRICE_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;

export const MAX_TEXT = 500;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function isTime(value: unknown): value is string {
  return typeof value === 'string' && TIME_PATTERN.test(value);
}

export function isPrice(value: unknown): boolean {
  return PRICE_PATTERN.test(String(value ?? '').trim());
}

/** Digits and one decimal point only, so a price field cannot keep letters. */
export function sanitizePriceInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  const dot = cleaned.indexOf('.');
  if (dot === -1) return cleaned.slice(0, 10);
  const whole = cleaned.slice(0, dot).slice(0, 10);
  const fraction = cleaned.slice(dot + 1).replace(/\./g, '').slice(0, 2);
  return `${whole}.${fraction}`;
}

/** Trimmed text, or null when empty. Returns undefined when the value is not a string or too long. */
export function cleanText(value: unknown, maxLength = MAX_TEXT): string | null | undefined {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (trimmed.length > maxLength) return undefined;
  return trimmed === '' ? null : trimmed;
}

export interface CustomerOrderInput {
  deliveryDate: string;
  factoryId: string;
  productId: string;
  licensePlate: string;
  customerNote: string | null;
}

/** Validates the customer form. Errors are keyed by field so the form can show them under each input. */
export function parseCustomerOrderInput(
  body: Record<string, unknown> | null
): { value: CustomerOrderInput; errors?: never } | { value?: never; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const licensePlate = cleanText(body?.license_plate, 50);
  const customerNote = cleanText(body?.customer_note, 1000);

  if (!isIsoDate(body?.delivery_date)) errors.delivery_date = 'กรุณาเลือกวันที่ส่งสินค้า';
  if (!isUuid(body?.factory_id)) errors.factory_id = 'กรุณาเลือกโรงงานปลายทาง';
  if (!isUuid(body?.product_id)) errors.product_id = 'กรุณาเลือกประเภทสินค้า';
  if (licensePlate === undefined) errors.license_plate = 'ทะเบียนรถยาวเกินไป';
  else if (!licensePlate) errors.license_plate = 'กรุณากรอกทะเบียนรถ';
  if (customerNote === undefined) errors.customer_note = 'หมายเหตุยาวเกิน 1000 ตัวอักษร';

  if (Object.keys(errors).length > 0) return { errors };
  return {
    value: {
      deliveryDate: body!.delivery_date as string,
      factoryId: body!.factory_id as string,
      productId: body!.product_id as string,
      licensePlate: licensePlate as string,
      customerNote: customerNote ?? null,
    },
  };
}

/** Turns query-string values into safe staff list filters; invalid values are ignored. */
export function parseStaffOrderFilters(get: (key: string) => string | null | undefined) {
  const status = get('status');
  const page = parseInt(get('page') || '1', 10);
  return {
    status: (ORDER_STATUSES as string[]).includes(status ?? '') ? (status as OrderStatus) : undefined,
    from: isIsoDate(get('from')) ? (get('from') as string) : undefined,
    to: isIsoDate(get('to')) ? (get('to') as string) : undefined,
    factoryId: isUuid(get('factory_id')) ? (get('factory_id') as string) : undefined,
    q: cleanText(get('q'), 100) || undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';
}
