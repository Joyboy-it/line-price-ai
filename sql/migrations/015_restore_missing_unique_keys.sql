-- Repair constraints defined by schema.sql and 002, missing on databases
-- created without them. 013 references users(id) and uses
-- ON CONFLICT (role, permission). No-op when the constraints already exist.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.users'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.role_permissions'::regclass
      AND conname = 'role_permissions_unique'
  ) THEN
    ALTER TABLE role_permissions
      ADD CONSTRAINT role_permissions_unique UNIQUE (role, permission);
  END IF;
END $$;
