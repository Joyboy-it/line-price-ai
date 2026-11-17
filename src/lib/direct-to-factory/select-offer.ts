export interface OfferCandidate {
  offerId: string;
  agentId: string;
  sheetOrder: number;
  price: number;
  isActive: boolean;
}

/**
 * Highest price wins. On a tie the earlier row in the latest price sheet wins.
 */
export function selectBestOffer<T extends OfferCandidate>(offers: T[]): T | null {
  let best: T | null = null;
  for (const candidate of offers) {
    if (!candidate.isActive) continue;
    if (
      best === null ||
      candidate.price > best.price ||
      (candidate.price === best.price && candidate.sheetOrder < best.sheetOrder)
    ) {
      best = candidate;
    }
  }
  return best;
}
