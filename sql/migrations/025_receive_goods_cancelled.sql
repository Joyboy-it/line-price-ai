-- Cancelled pickup notices, and the day a notice was marked finished.
ALTER TABLE receive_goods_notices DROP CONSTRAINT IF EXISTS receive_goods_status_check;
ALTER TABLE receive_goods_notices
  ADD CONSTRAINT receive_goods_status_check
  CHECK (status IN ('waiting', 'queued', 'completed', 'cancelled'));

ALTER TABLE receive_goods_notices
  ADD COLUMN IF NOT EXISTS completed_on DATE;

UPDATE receive_goods_notices
SET completed_on = (updated_at AT TIME ZONE 'Asia/Bangkok')::date
WHERE status = 'completed' AND completed_on IS NULL;
