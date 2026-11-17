import { describe, expect, it } from 'vitest';
import { formatReceiveNoticeItems, parseReceiveSubmission } from '@/lib/receive-goods';

describe('receive goods lines', () => {
  it('summarizes a queue the way staff read it', () => {
    expect(formatReceiveNoticeItems({
      product_type: null,
      detail: null,
      items: [
        { product_type: 'large_battery', quantity: 100, unit: 'piece' },
        { product_type: 'small_battery', quantity: 50, unit: 'piece' },
      ],
    })).toBe('แบตเตอรี่ใหญ่ 100 ลูก, แบตเตอรี่เล็ก 50 ลูก');
  });

  it('accepts several lines and rejects an empty quantity', () => {
    const parsed = parseReceiveSubmission({
      note: '',
      items: [
        { product_type: 'large_battery', quantity: '100', unit: 'piece' },
        { product_type: 'other', quantity: '12.5', unit: 'kilogram' },
      ],
    });
    expect(parsed).toEqual({
      value: {
        note: null,
        items: [
          { product_type: 'large_battery', quantity: 100, unit: 'piece' },
          { product_type: 'other', quantity: 12.5, unit: 'kilogram' },
        ],
      },
    });
    expect(parseReceiveSubmission({
      note: '',
      items: [{ product_type: 'other', quantity: '0', unit: 'kilogram' }],
    })).toEqual({ error: 'กรุณากรอกจำนวนสินค้า' });
  });
});