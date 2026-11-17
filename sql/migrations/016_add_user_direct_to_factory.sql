-- Approved users can see the factory home buttons until an admin turns this off.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS can_direct_to_factory BOOLEAN NOT NULL DEFAULT TRUE;
