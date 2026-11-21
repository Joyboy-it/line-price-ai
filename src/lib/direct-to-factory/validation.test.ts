import { describe, expect, it } from 'vitest';
import { parseStaffOrderInput, staffCreateOrderRefusal } from '@/lib/direct-to-factory/validation';

const valid = {
  user_id: '11111111-1111-4111-8111-111111111111',
  delivery_date: '2026-11-21',
  factory_id: '22222222-2222-4222-8222-222222222222',
  product_id: '33333333-3333-4333-8333-333333333333',
  license_plate: '1กข 1234',
  customer_note: '',
};

describe('parseStaffOrderInput', () => {
  it('accepts a complete staff order and keeps the customer id', () => {
    expect(parseStaffOrderInput(valid).value).toMatchObject({
      userId: valid.user_id,
      deliveryDate: '2026-11-21',
      licensePlate: '1กข 1234',
      customerNote: null,
    });
  });

  it('rejects a customer id that is not a uuid', () => {
    expect(parseStaffOrderInput({ ...valid, user_id: 'nope' }).errors?.user_id).toBe('กรุณาเลือกลูกค้า');
  });

  it('reports a missing customer together with the other empty fields', () => {
    expect(parseStaffOrderInput({}).errors).toMatchObject({
      user_id: 'กรุณาเลือกลูกค้า',
      delivery_date: 'กรุณาเลือกวันที่ส่งสินค้า',
    });
  });
});

describe('staffCreateOrderRefusal', () => {
  it('refuses a customer without factory access before checking the product', () => {
    expect(staffCreateOrderRefusal({ eligible: false, productAvailable: true, hasOffer: true })).toEqual({
      error: 'ลูกค้านี้ยังไม่มีสิทธิ์ส่งตรงเข้าโรงงาน',
      fields: { user_id: 'ลูกค้านี้ยังไม่มีสิทธิ์ส่งตรงเข้าโรงงาน' },
    });
  });

  it('refuses a product that is not open at the factory', () => {
    expect(staffCreateOrderRefusal({ eligible: true, productAvailable: false, hasOffer: true })).toEqual({
      error: 'สินค้านี้ยังไม่เปิดรับ',
      fields: { product_id: 'สินค้านี้ยังไม่เปิดรับที่โรงงานนี้' },
    });
  });

  it('refuses a product that has no usable offer', () => {
    expect(staffCreateOrderRefusal({ eligible: true, productAvailable: true, hasOffer: false })).toEqual({
      error: 'สินค้านี้ยังไม่เปิดรับ',
      fields: { product_id: 'สินค้านี้ยังไม่เปิดรับที่โรงงานนี้' },
    });
  });

  it('accepts an eligible customer with an open product and an offer', () => {
    expect(staffCreateOrderRefusal({ eligible: true, productAvailable: true, hasOffer: true })).toBeNull();
  });
});
