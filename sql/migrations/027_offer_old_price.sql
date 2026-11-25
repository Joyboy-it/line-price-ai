-- Optional previous price entered by staff. It is not part of the latest-price formula.
ALTER TABLE agent_offers
  ADD COLUMN IF NOT EXISTS old_price NUMERIC(12, 2);

ALTER TABLE agent_offers DROP CONSTRAINT IF EXISTS agent_offers_old_price_check;
ALTER TABLE agent_offers
  ADD CONSTRAINT agent_offers_old_price_check CHECK (old_price IS NULL OR old_price >= 0);
