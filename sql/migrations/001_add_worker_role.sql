-- ============================================
-- Migration: Add 'worker' role to user_role ENUM
-- Date: 2026-02-04
-- Description: Add worker role to support limited permissions
-- ============================================

-- Add 'worker' to the user_role ENUM type
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'worker';

-- Note: This migration is safe to run multiple times
-- The IF NOT EXISTS clause prevents errors if 'worker' already exists
