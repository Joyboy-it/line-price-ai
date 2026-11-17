-- Row order from the latest price sheet. Lower numbers win when the best price is tied.
ALTER TABLE agent_offers ADD COLUMN IF NOT EXISTS sheet_order INTEGER;

WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS n
  FROM agent_offers
  WHERE sheet_order IS NULL
)
UPDATE agent_offers ao
SET sheet_order = ordered.n
FROM ordered
WHERE ao.id = ordered.id;

ALTER TABLE agent_offers ALTER COLUMN sheet_order SET NOT NULL;
