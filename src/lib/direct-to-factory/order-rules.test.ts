import { describe, expect, it } from 'vitest';
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  canCustomerEdit,
  toCustomerView,
} from '@/lib/direct-to-factory/order-rules';
import type { FactoryOrderRecord } from '@/lib/direct-to-factory/types';

function order(overrides: Partial<FactoryOrderRecord> = {}): FactoryOrderRecord {
  return {
    id: 'order-1',
    user_id: 'user-1',
    customer_name: 'ลูกค้า ทดสอบ',
    delivery_date: '2026-11-12',
    factory_id: 'f1',
    factory_name: 'Prime',
    product_id: 'p1',
    product_name: 'สแตนเลส SUS 201',
    license_plate: '1กข 1234',
    customer_note: null,
    offer_id: 'offer-1',
    agent_id: 'agent-2',
    agent_name: '2',
    price: '9.73',
    po_number: 'PO-777',
    delivery_note_number: 'DN-555',
    form_file_path: '/direct-to-factory/form.pdf',
    form_file_name: 'form.pdf',
    form_mime_type: 'application/pdf',
    confirmed_date: null,
    delivery_time: null,
    confirmed_factory_id: null,
    confirmed_factory_name: null,
    confirmed_product_id: null,
    confirmed_product_name: null,
    staff_note: null,
    status: 'customer_submitted',
    cancelled_at: null,
    created_at: '2026-11-11T05:00:00.000Z',
    updated_at: '2026-11-11T05:00:00.000Z',
    ...overrides,
  };
}

describe('order statuses', () => {
  it('has a Thai label for every status from the form', () => {
    expect(ORDER_STATUSES).toEqual(['customer_submitted', 'pending', 'updated', 'completed', 'cancelled']);
    expect(ORDER_STATUS_LABELS).toEqual({
      customer_submitted: 'ลูกค้าแจ้ง',
      pending: 'รอดำเนินการ',
      updated: 'อัพเดทข้อมูล',
      completed: 'จบรายการ',
      cancelled: 'ยกเลิก',
    });
  });
});

describe('canCustomerEdit', () => {
  it('allows editing a new order that staff has not confirmed', () => {
    expect(canCustomerEdit(order())).toBe(true);
    expect(canCustomerEdit(order({ status: 'pending' }))).toBe(true);
  });

  it('locks the order once staff confirms a date', () => {
    expect(canCustomerEdit(order({ confirmed_date: '2026-11-13' }))).toBe(false);
  });

  it('locks cancelled and completed orders', () => {
    expect(canCustomerEdit(order({ status: 'cancelled' }))).toBe(false);
    expect(canCustomerEdit(order({ status: 'completed' }))).toBe(false);
  });
});

describe('toCustomerView', () => {
  it('never exposes price, agent, PO or delivery note numbers', () => {
    const view = toCustomerView(order(), []);
    const keys = Object.keys(view);

    for (const hidden of ['price', 'agent_id', 'agent_name', 'po_number', 'delivery_note_number', 'offer_id', 'form_file_path']) {
      expect(keys).not.toContain(hidden);
    }
    expect(JSON.stringify(view)).not.toContain('9.73');
    expect(JSON.stringify(view)).not.toContain('PO-777');
    expect(JSON.stringify(view)).not.toContain('DN-555');
  });

  it('keeps what the customer entered, the form file name and the edit flag', () => {
    const view = toCustomerView(order(), []);

    expect(view).toMatchObject({
      id: 'order-1',
      delivery_date: '2026-11-12',
      factory_name: 'Prime',
      product_name: 'สแตนเลส SUS 201',
      license_plate: '1กข 1234',
      form_file_name: 'form.pdf',
      has_form_file: true,
      status: 'customer_submitted',
      status_label: 'ลูกค้าแจ้ง',
      can_edit: true,
    });
  });

  it('shows staff confirmation fields and files without their storage paths', () => {
    const view = toCustomerView(
      order({ confirmed_date: '2026-11-13', delivery_time: '08:30', staff_note: 'เข้าประตู 2', status: 'updated' }),
      [{ id: 'file-1', kind: 'delivery_note', file_name: 'ใบนำส่ง.pdf', file_path: '/direct-to-factory/x.pdf', mime_type: 'application/pdf', file_size: 100, created_at: '2026-11-11T06:00:00.000Z' }]
    );

    expect(view).toMatchObject({ confirmed_date: '2026-11-13', delivery_time: '08:30', staff_note: 'เข้าประตู 2', can_edit: false });
    expect(view.files).toEqual([{ id: 'file-1', kind: 'delivery_note', file_name: 'ใบนำส่ง.pdf', created_at: '2026-11-11T06:00:00.000Z' }]);
  });
});
