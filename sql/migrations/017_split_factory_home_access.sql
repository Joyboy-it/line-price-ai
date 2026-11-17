-- Separate the factory list from the new-order form. Existing combined switch, if present, applies to both.
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_view_factory_orders BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_create_factory_order BOOLEAN NOT NULL DEFAULT TRUE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'can_direct_to_factory'
  ) THEN
    UPDATE users
    SET can_view_factory_orders = can_direct_to_factory,
        can_create_factory_order = can_direct_to_factory;
    ALTER TABLE users DROP COLUMN can_direct_to_factory;
  END IF;
END $$;
