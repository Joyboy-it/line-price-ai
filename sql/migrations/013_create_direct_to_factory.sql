-- ============================================
-- Migration: Direct-to-factory orders (ส่งตรงเข้าโรงงาน)
-- Description: factories, products, agents, agent offers (daily price import),
--              customer orders with staff confirmation and order files
-- ============================================

CREATE TABLE IF NOT EXISTS factories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS factory_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  factory_id UUID NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT factory_products_unique UNIQUE (factory_id, name)
);

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES factory_products(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  po_number TEXT,
  delivery_note_number TEXT,
  form_file_path TEXT,
  form_file_name TEXT,
  form_mime_type TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT agent_offers_unique UNIQUE (product_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_offers_product ON agent_offers(product_id);

CREATE TABLE IF NOT EXISTS factory_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Customer input
  delivery_date DATE NOT NULL,
  factory_id UUID NOT NULL REFERENCES factories(id),
  product_id UUID NOT NULL REFERENCES factory_products(id),
  license_plate TEXT NOT NULL,
  customer_note TEXT,

  -- Snapshot of the selected offer at order time (staff only, except form file)
  offer_id UUID REFERENCES agent_offers(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  price NUMERIC(12, 2),
  po_number TEXT,
  delivery_note_number TEXT,
  form_file_path TEXT,
  form_file_name TEXT,
  form_mime_type TEXT,

  -- Staff confirmation
  confirmed_date DATE,
  delivery_time TIME,
  confirmed_factory_id UUID REFERENCES factories(id),
  confirmed_product_id UUID REFERENCES factory_products(id),
  staff_note TEXT,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,

  status TEXT NOT NULL DEFAULT 'customer_submitted'
    CHECK (status IN ('customer_submitted', 'pending', 'updated', 'completed', 'cancelled')),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_factory_orders_user ON factory_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_factory_orders_status_created ON factory_orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_factory_orders_factory ON factory_orders(factory_id);

CREATE TABLE IF NOT EXISTS factory_order_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES factory_orders(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('delivery_note', 'attachment')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  file_size INT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_factory_order_files_order ON factory_order_files(order_id);

-- updated_at triggers (update_updated_at_column() is defined in schema.sql)
DROP TRIGGER IF EXISTS tr_factories_updated_at ON factories;
CREATE TRIGGER tr_factories_updated_at
  BEFORE UPDATE ON factories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_factory_products_updated_at ON factory_products;
CREATE TRIGGER tr_factory_products_updated_at
  BEFORE UPDATE ON factory_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_agents_updated_at ON agents;
CREATE TRIGGER tr_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_agent_offers_updated_at ON agent_offers;
CREATE TRIGGER tr_agent_offers_updated_at
  BEFORE UPDATE ON agent_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_factory_orders_updated_at ON factory_orders;
CREATE TRIGGER tr_factory_orders_updated_at
  BEFORE UPDATE ON factory_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Back-office permission for admin and operator
INSERT INTO role_permissions (role, permission) VALUES
  ('admin', 'manage_factory_orders'),
  ('operator', 'manage_factory_orders')
ON CONFLICT (role, permission) DO NOTHING;
