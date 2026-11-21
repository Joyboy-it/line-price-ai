import { describe, expect, it } from 'vitest';
import { formatThaiDate } from '@/lib/direct-to-factory/format';
import { describeFactoryOrderLog } from '@/lib/direct-to-factory/order-log';

describe('describeFactoryOrderLog', () => {
  it('describes a new order by its delivery date', () => {
    expect(describeFactoryOrderLog('create_factory_order', { delivery_date: '2026-11-13' })).toEqual({
      title: 'สร้างรายการ',
      detail: `วันที่ส่งสินค้า ${formatThaiDate('2026-11-13')}`,
    });
  });

  it('names the staff member when they create the order', () => {
    expect(describeFactoryOrderLog('create_factory_order', {
      by: 'staff',
      delivery_date: '2026-11-21',
    })).toEqual({
      title: 'สร้างรายการ (เจ้าหน้าที่)',
      detail: `วันที่ส่งสินค้า ${formatThaiDate('2026-11-21')}`,
    });
  });

  it('describes a staff edit and names the resulting status once', () => {
    expect(
      describeFactoryOrderLog('update_factory_order', {
        by: 'staff',
        fields: ['price', 'status', 'offer_id', 'agent_id', 'form_file_name', 'form_file_path'],
        status: 'pending',
      })
    ).toEqual({
      title: 'แก้ไขรายการ (เจ้าหน้าที่)',
      detail: 'ราคา, สถานะเป็น รอดำเนินการ, ข้อเสนอตัวแทน, ไฟล์แบบฟอร์ม',
    });
  });

  it('describes a file upload with its kind and name', () => {
    expect(
      describeFactoryOrderLog('update_factory_order', {
        by: 'staff',
        action: 'upload_file',
        kind: 'delivery_note',
        file_name: 'ใบส่งของ.xlsx',
      })
    ).toEqual({
      title: 'อัปโหลดไฟล์ (เจ้าหน้าที่)',
      detail: 'ใบส่งของ ใบส่งของ.xlsx',
    });
  });

  it('describes a customer edit that changes the product', () => {
    expect(describeFactoryOrderLog('update_factory_order', { by: 'customer', product_changed: true })).toEqual({
      title: 'แก้ไขรายการ (ลูกค้า)',
      detail: 'เปลี่ยนโรงงานหรือสินค้า',
    });
  });

  it('describes a cancellation', () => {
    expect(describeFactoryOrderLog('cancel_factory_order', { by: 'customer' })).toEqual({
      title: 'ยกเลิกรายการ (ลูกค้า)',
      detail: '',
    });
  });

  it('keeps an unknown action readable', () => {
    expect(describeFactoryOrderLog('other_action', null)).toEqual({ title: 'other_action', detail: '' });
  });
});
