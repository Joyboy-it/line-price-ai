import { describe, expect, it } from 'vitest';
import { bangkokDate } from '@/lib/direct-to-factory/format';

describe('bangkokDate', () => {
  it('uses the Bangkok calendar date across midnight UTC', () => {
    expect(bangkokDate(new Date('2026-11-13T16:30:00.000Z'))).toBe('2026-11-13');
    expect(bangkokDate(new Date('2026-11-13T17:30:00.000Z'))).toBe('2026-11-14');
  });
});
