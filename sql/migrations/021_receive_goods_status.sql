-- Queue tracking for pickup notices. No agents and no spreadsheet import.
ALTER TABLE receive_goods_notices
  ADD COLUMN IF NOT EXISTS product_type TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'customer_submitted',
  ADD COLUMN IF NOT EXISTS staff_note TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE receive_goods_notices SET product_type = 'other' WHERE product_type IS NULL;

ALTER TABLE receive_goods_notices ALTER COLUMN product_type SET NOT NULL;
ALTER TABLE receive_goods_notices ALTER COLUMN detail DROP NOT NULL;

ALTER TABLE receive_goods_notices DROP CONSTRAINT IF EXISTS receive_goods_product_type_check;
ALTER TABLE receive_goods_notices
  ADD CONSTRAINT receive_goods_product_type_check
  CHECK (product_type IN ('large_battery', 'small_battery', 'other'));

ALTER TABLE receive_goods_notices DROP CONSTRAINT IF EXISTS receive_goods_status_check;
ALTER TABLE receive_goods_notices
  ADD CONSTRAINT receive_goods_status_check
  CHECK (status IN ('customer_submitted', 'pending', 'updated', 'completed', 'cancelled'));
