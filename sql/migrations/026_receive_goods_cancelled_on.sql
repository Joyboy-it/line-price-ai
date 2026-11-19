-- The day a pickup notice was cancelled, used to look up past cancellations.
ALTER TABLE receive_goods_notices
  ADD COLUMN IF NOT EXISTS cancelled_on DATE;

UPDATE receive_goods_notices
SET cancelled_on = (updated_at AT TIME ZONE 'Asia/Bangkok')::date
WHERE status = 'cancelled' AND cancelled_on IS NULL;
