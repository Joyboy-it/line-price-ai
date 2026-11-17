import { formatThaiDate } from './format';
import { isOrderStatus, ORDER_STATUS_LABELS } from './order-rules';

const FIELD_LABELS: Record<string, string> = {
  confirmed_date: 'วันที่ยืนยัน',
  delivery_time: 'เวลาส่ง',
  confirmed_factory_id: 'โรงงานที่ยืนยัน',
  confirmed_product_id: 'สินค้าที่ยืนยัน',
  price: 'ราคา',
  po_number: 'เลขที่ PO',
  delivery_note_number: 'เลขที่ใบส่งของ',
  staff_note: 'หมายเหตุเจ้าหน้าที่',
  status: 'สถานะ',
};

const FIELD_GROUPS: Record<string, string> = {
  offer_id: 'ข้อเสนอตัวแทน',
  agent_id: 'ข้อเสนอตัวแทน',
  form_file_path: 'ไฟล์แบบฟอร์ม',
  form_file_name: 'ไฟล์แบบฟอร์ม',
  form_mime_type: 'ไฟล์แบบฟอร์ม',
};

function actor(details: Record<string, unknown> | null): string {
  if (details?.by === 'staff') return 'เจ้าหน้าที่';
  if (details?.by === 'customer') return 'ลูกค้า';
  return '';
}

function title(label: string, details: Record<string, unknown> | null): string {
  const who = actor(details);
  return who ? `${label} (${who})` : label;
}

function fieldSummary(fields: unknown, status: unknown): string {
  if (!Array.isArray(fields)) return '';
  const statusLabel = typeof status === 'string' && isOrderStatus(status) ? ORDER_STATUS_LABELS[status] : null;
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const field of fields) {
    if (typeof field !== 'string') continue;
    const label = field === 'status' && statusLabel
      ? `สถานะเป็น ${statusLabel}`
      : (FIELD_GROUPS[field] ?? FIELD_LABELS[field] ?? field);
    if (seen.has(label)) continue;
    seen.add(label);
    labels.push(label);
  }
  return labels.join(', ');
}

function fileSummary(details: Record<string, unknown>): string {
  const kind = details.kind === 'delivery_note' ? 'ใบส่งของ' : details.kind === 'attachment' ? 'ไฟล์แนบ' : '';
  const name = typeof details.file_name === 'string' ? details.file_name : '';
  return [kind, name].filter(Boolean).join(' ');
}

/** Thai title and one-line detail for a factory-order audit row. */
export function describeFactoryOrderLog(
  action: string,
  details: Record<string, unknown> | null
): { title: string; detail: string } {
  if (action === 'create_factory_order') {
    const date = typeof details?.delivery_date === 'string' ? formatThaiDate(details.delivery_date) : '';
    return { title: 'สร้างรายการ', detail: date && date !== '-' ? `วันที่ส่งสินค้า ${date}` : '' };
  }
  if (action === 'cancel_factory_order') {
    return { title: title('ยกเลิกรายการ', details), detail: '' };
  }
  if (details?.action === 'upload_file') {
    return { title: title('อัปโหลดไฟล์', details), detail: fileSummary(details) };
  }
  if (details?.action === 'delete_file') {
    return { title: title('ลบไฟล์', details), detail: fileSummary(details) };
  }
  if (action === 'update_factory_order') {
    if (details?.by === 'customer') {
      return {
        title: title('แก้ไขรายการ', details),
        detail: details.product_changed === true ? 'เปลี่ยนโรงงานหรือสินค้า' : 'แก้ไขข้อมูลที่แจ้งไว้',
      };
    }
    return { title: title('แก้ไขรายการ', details), detail: fieldSummary(details?.fields, details?.status) };
  }
  return { title: action, detail: '' };
}
