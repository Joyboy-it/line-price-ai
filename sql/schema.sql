-- ============================================
-- LINE PRICE AI - PostgreSQL Database Schema
-- Version: 2.0 (Optimized)
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUM Types for better data integrity
-- ============================================

CREATE TYPE user_role AS ENUM ('user', 'operator', 'admin');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE log_action AS ENUM (
  'login', 'logout', 'register',
  'upload_image', 'delete_image',
  'create_group', 'update_group', 'delete_group',
  'create_branch', 'update_branch', 'delete_branch',
  'create_announcement', 'update_announcement', 'delete_announcement',
  'approve_request', 'reject_request',
  'update_user', 'delete_user'
);

-- ============================================
-- 1. USERS TABLE
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL DEFAULT 'line',
  name VARCHAR(255),
  email VARCHAR(255),
  image TEXT,
  role user_role NOT NULL DEFAULT 'user',
  shop_name VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  bank_info JSONB DEFAULT '{}',
  note TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  email_verified_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_provider_unique UNIQUE (provider, provider_id)
);

CREATE INDEX idx_users_provider_id ON users(provider_id);
CREATE INDEX idx_users_role ON users(role) WHERE is_active = TRUE;
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================
-- 2. BRANCHES TABLE
-- ============================================

CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT branches_code_unique UNIQUE (code)
);

CREATE INDEX idx_branches_active ON branches(is_active, sort_order);

-- ============================================
-- 3. USER_BRANCHES TABLE (Many-to-Many)
-- ============================================

CREATE TABLE user_branches (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, branch_id)
);

CREATE INDEX idx_user_branches_branch ON user_branches(branch_id);

-- ============================================
-- 4. PRICE_GROUPS TABLE
-- ============================================

CREATE TABLE price_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  telegram_chat_id VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_groups_branch ON price_groups(branch_id) WHERE is_active = TRUE;
CREATE INDEX idx_price_groups_active ON price_groups(is_active, sort_order);

-- ============================================
-- 5. ACCESS_REQUESTS TABLE
-- ============================================

CREATE TABLE access_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  shop_name VARCHAR(255) NOT NULL,
  note TEXT,
  status request_status NOT NULL DEFAULT 'pending',
  reject_reason TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_access_requests_user ON access_requests(user_id);
CREATE INDEX idx_access_requests_status ON access_requests(status) WHERE status = 'pending';
CREATE INDEX idx_access_requests_created ON access_requests(created_at DESC);

-- ============================================
-- 6. USER_GROUP_ACCESS TABLE (Many-to-Many)
-- ============================================

CREATE TABLE user_group_access (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  price_group_id UUID NOT NULL REFERENCES price_groups(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, price_group_id)
);

CREATE INDEX idx_user_group_access_group ON user_group_access(price_group_id);

-- ============================================
-- 7. PRICE_GROUP_IMAGES TABLE
-- ============================================

CREATE TABLE price_group_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  price_group_id UUID NOT NULL REFERENCES price_groups(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  title VARCHAR(255),
  sort_order INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_group_images_group ON price_group_images(price_group_id, sort_order);
CREATE INDEX idx_price_group_images_created ON price_group_images(created_at DESC);

-- ============================================
-- 8. ANNOUNCEMENTS TABLE
-- ============================================

CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  body TEXT,
  image_path TEXT,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  publish_at TIMESTAMPTZ,
  expire_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcements_published ON announcements(is_published, created_at DESC)
  WHERE is_published = TRUE;

-- ============================================
-- 9. ANNOUNCEMENT_IMAGES TABLE
-- ============================================

CREATE TABLE announcement_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcement_images_announcement ON announcement_images(announcement_id, sort_order);

-- ============================================
-- 10. USER_LOGS TABLE (Audit Trail)
-- ============================================

CREATE TABLE user_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action log_action NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_logs_user ON user_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_user_logs_action ON user_logs(action);
CREATE INDEX idx_user_logs_created ON user_logs(created_at DESC);

-- ============================================
-- 11. NEXTAUTH TABLES
-- ============================================

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type VARCHAR(255),
  scope VARCHAR(255),
  id_token TEXT,
  session_state VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT accounts_provider_unique UNIQUE (provider, provider_account_id)
);

CREATE INDEX idx_accounts_user ON accounts(user_id);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_token VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(session_token);

CREATE TABLE verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_branches_updated_at
  BEFORE UPDATE ON branches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_price_groups_updated_at
  BEFORE UPDATE ON price_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_access_requests_updated_at
  BEFORE UPDATE ON access_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA
-- ============================================

INSERT INTO branches (name, code, sort_order) VALUES 
  ('กรุงเทพ', 'BKK', 1),
  ('เชียงใหม่', 'CNX', 2),
  ('ภูเก็ต', 'HKT', 3),
  ('ขอนแก่น', 'KKC', 4)
ON CONFLICT (code) DO NOTHING;
