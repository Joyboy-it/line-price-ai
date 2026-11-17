-- Allow pickup notices to be marked finished.
ALTER TABLE receive_goods_notices DROP CONSTRAINT IF EXISTS receive_goods_status_check;
ALTER TABLE receive_goods_notices
  ADD CONSTRAINT receive_goods_status_check
  CHECK (status IN ('waiting', 'queued', 'completed'));
