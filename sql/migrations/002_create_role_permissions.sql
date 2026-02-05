-- ============================================
-- Migration: Create role_permissions table
-- Description: Store dynamic role permissions in database
-- ============================================

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role user_role NOT NULL,
  permission VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT role_permissions_unique UNIQUE (role, permission)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);

-- Insert default permissions for admin
INSERT INTO role_permissions (role, permission) VALUES
  ('admin', 'view_dashboard'),
  ('admin', 'manage_users'),
  ('admin', 'toggle_user_status'),
  ('admin', 'manage_branches'),
  ('admin', 'manage_price_groups'),
  ('admin', 'upload_images'),
  ('admin', 'manage_announcements'),
  ('admin', 'approve_requests'),
  ('admin', 'view_analytics'),
  ('admin', 'manage_roles')
ON CONFLICT (role, permission) DO NOTHING;

-- Insert default permissions for operator
INSERT INTO role_permissions (role, permission) VALUES
  ('operator', 'view_dashboard'),
  ('operator', 'manage_users'),
  ('operator', 'manage_branches'),
  ('operator', 'manage_price_groups'),
  ('operator', 'upload_images'),
  ('operator', 'manage_announcements'),
  ('operator', 'approve_requests'),
  ('operator', 'view_analytics')
ON CONFLICT (role, permission) DO NOTHING;

-- Insert default permissions for worker
INSERT INTO role_permissions (role, permission) VALUES
  ('worker', 'view_dashboard'),
  ('worker', 'upload_images')
ON CONFLICT (role, permission) DO NOTHING;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_role_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_role_permissions_updated_at
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_role_permissions_updated_at();

-- Add comment
COMMENT ON TABLE role_permissions IS 'Stores dynamic role-based permissions';
