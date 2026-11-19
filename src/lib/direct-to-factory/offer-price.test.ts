import { describe, expect, it } from 'vitest';
import { offerPriceFromParts } from '@/lib/direct-to-factory/validation';

describe('offerPriceFromParts', () => {
  it('adds markup and subtracts the profit deduction', () => {
    expect(offerPriceFromParts(10, 2, 1)).toBe(11);
  });

  it('rejects a deduction larger than factory price plus markup', () => {
    expect(offerPriceFromParts(10, 2, 13)).toBeNull();
  });
});
