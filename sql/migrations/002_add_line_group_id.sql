-- ============================================
-- Migration: Add line_group_id to price_groups table
-- Date: 2026-02-04
-- Description: Add LINE Group ID field for sending notifications to LINE groups
-- ============================================

-- Add line_group_id column to price_groups table
ALTER TABLE price_groups 
ADD COLUMN IF NOT EXISTS line_group_id VARCHAR(100);

-- Add comment
COMMENT ON COLUMN price_groups.line_group_id IS 'LINE Group ID for sending text notifications (no images)';

-- Note: This migration is safe to run multiple times
-- The IF NOT EXISTS clause prevents errors if column already exists
