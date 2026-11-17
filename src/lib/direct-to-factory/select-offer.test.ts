import { describe, expect, it } from 'vitest';
import { selectBestOffer, type OfferCandidate } from '@/lib/direct-to-factory/select-offer';

function offer(overrides: Partial<OfferCandidate> & { offerId: string }): OfferCandidate {
  return { agentId: overrides.offerId, sheetOrder: 1, price: 0, isActive: true, ...overrides };
}

describe('selectBestOffer', () => {
  it('picks the highest price (SUS 201: agent 2 at 9.73 beats agent 1 at 9.00)', () => {
    const agent1 = offer({ offerId: 'a1', sheetOrder: 1, price: 9.0 });
    const agent2 = offer({ offerId: 'a2', sheetOrder: 2, price: 9.73 });

    expect(selectBestOffer([agent1, agent2])?.offerId).toBe('a2');
  });

  it('breaks a price tie with the earlier row in the price sheet', () => {
    const later = offer({ offerId: 'later', sheetOrder: 5, price: 10 });
    const first = offer({ offerId: 'first', sheetOrder: 1, price: 10 });

    expect(selectBestOffer([later, first])?.offerId).toBe('first');
  });

  it('never selects an inactive offer, even with a higher price', () => {
    const inactive = offer({ offerId: 'off', price: 99, isActive: false });
    const active = offer({ offerId: 'on', price: 1 });

    expect(selectBestOffer([inactive, active])?.offerId).toBe('on');
  });

  it('returns null when there is nothing to choose from', () => {
    expect(selectBestOffer([])).toBeNull();
    expect(selectBestOffer([offer({ offerId: 'off', price: 5, isActive: false })])).toBeNull();
  });
});
