-- Pickup notices: destination, line items, and two queue statuses.
CREATE SEQUENCE IF NOT EXISTS receive_goods_queue_no_seq;

ALTER TABLE receive_goods_notices
  ADD COLUMN IF NOT EXISTS queue_no INTEGER,
  ADD COLUMN IF NOT EXISTS destination_name TEXT,
  ADD COLUMN IF NOT EXISTS actual_receive_date DATE;

WITH base AS (
  SELECT COALESCE(MAX(queue_no), 0) AS start_no FROM receive_goods_notices
),
numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS n
  FROM receive_goods_notices
  WHERE queue_no IS NULL
)
UPDATE receive_goods_notices AS notice
SET queue_no = numbered.n + base.start_no
FROM numbered, base
WHERE notice.id = numbered.id;

SELECT setval(
  'receive_goods_queue_no_seq',
  COALESCE((SELECT MAX(queue_no) FROM receive_goods_notices), 1),
  COALESCE((SELECT MAX(queue_no) FROM receive_goods_notices), 0) > 0
);

ALTER TABLE receive_goods_notices
  ALTER COLUMN queue_no SET DEFAULT nextval('receive_goods_queue_no_seq'),
  ALTER COLUMN queue_no SET NOT NULL,
  ALTER COLUMN receive_date DROP NOT NULL,
  ALTER COLUMN product_type DROP NOT NULL,
  ALTER COLUMN status SET DEFAULT 'waiting';

CREATE UNIQUE INDEX IF NOT EXISTS receive_goods_notices_queue_no_key
  ON receive_goods_notices(queue_no);

ALTER TABLE receive_goods_notices DROP CONSTRAINT IF EXISTS receive_goods_status_check;

UPDATE receive_goods_notices
SET status = CASE WHEN status = 'customer_submitted' THEN 'waiting' ELSE 'queued' END
WHERE status NOT IN ('waiting', 'queued');

ALTER TABLE receive_goods_notices
  ADD CONSTRAINT receive_goods_status_check
  CHECK (status IN ('waiting', 'queued'));

ALTER TABLE receive_goods_notices DROP CONSTRAINT IF EXISTS receive_goods_product_type_check;
ALTER TABLE receive_goods_notices
  ADD CONSTRAINT receive_goods_product_type_check
  CHECK (product_type IS NULL OR product_type IN ('large_battery', 'small_battery', 'lead', 'other'));

CREATE TABLE IF NOT EXISTS receive_goods_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notice_id UUID NOT NULL REFERENCES receive_goods_notices(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL,
  quantity NUMERIC(12, 2),
  unit TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT receive_goods_items_product_check
    CHECK (product_type IN ('large_battery', 'small_battery', 'lead', 'other')),
  CONSTRAINT receive_goods_items_unit_check
    CHECK (unit IN ('piece', 'kilogram')),
  CONSTRAINT receive_goods_items_quantity_check
    CHECK (quantity IS NULL OR quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_receive_goods_items_notice
  ON receive_goods_items(notice_id, sort_order);

INSERT INTO receive_goods_items (notice_id, product_type, quantity, unit, sort_order)
SELECT n.id, n.product_type, NULL, 'piece', 0
FROM receive_goods_notices n
WHERE n.product_type IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM receive_goods_items i WHERE i.notice_id = n.id
  );

GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE ON receive_goods_items TO admin;
GRANT USAGE, SELECT ON SEQUENCE receive_goods_queue_no_seq TO admin;
