export interface OfferCandidate {
  offerId: string;
  agentId: string;
  agentSortOrder: number;
  price: number;
  isActive: boolean;
}

/**
 * Highest price wins; on a tie the agent with the lower sort order (set by staff) wins.
 */
export function selectBestOffer<T extends OfferCandidate>(offers: T[]): T | null {
  let best: T | null = null;
  for (const candidate of offers) {
    if (!candidate.isActive) continue;
    if (
      best === null ||
      candidate.price > best.price ||
      (candidate.price === best.price && candidate.agentSortOrder < best.agentSortOrder)
    ) {
      best = candidate;
    }
  }
  return best;
}
