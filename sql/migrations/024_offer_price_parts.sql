-- Latest decision price is factory price plus markup minus profit deduction.
ALTER TABLE agent_offers
  ADD COLUMN IF NOT EXISTS factory_price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS price_markup NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit_deduction NUMERIC(12, 2) NOT NULL DEFAULT 0;

UPDATE agent_offers SET factory_price = price WHERE factory_price IS NULL;

ALTER TABLE agent_offers ALTER COLUMN factory_price SET NOT NULL;
ALTER TABLE agent_offers ALTER COLUMN factory_price SET DEFAULT 0;

ALTER TABLE agent_offers DROP CONSTRAINT IF EXISTS agent_offers_factory_price_check;
ALTER TABLE agent_offers
  ADD CONSTRAINT agent_offers_factory_price_check CHECK (factory_price >= 0);

ALTER TABLE agent_offers DROP CONSTRAINT IF EXISTS agent_offers_price_markup_check;
ALTER TABLE agent_offers
  ADD CONSTRAINT agent_offers_price_markup_check CHECK (price_markup >= 0);

ALTER TABLE agent_offers DROP CONSTRAINT IF EXISTS agent_offers_profit_deduction_check;
ALTER TABLE agent_offers
  ADD CONSTRAINT agent_offers_profit_deduction_check CHECK (profit_deduction >= 0);
