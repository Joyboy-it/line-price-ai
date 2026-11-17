-- แจ้งรับสินค้า is separate from direct-to-factory orders.
CREATE TABLE IF NOT EXISTS receive_goods_notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receive_date DATE NOT NULL,
  detail TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receive_goods_notices_user
  ON receive_goods_notices(user_id, created_at DESC);

ALTER TABLE users ADD COLUMN IF NOT EXISTS can_receive_goods BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE users
SET can_receive_goods = can_create_factory_order
WHERE can_create_factory_order IS NOT NULL;
