-- Migration: Add new log actions for branches and announcements
-- Date: 2026-02-03
-- Description: Add branch and announcement actions to log_action enum

-- Add new values to the log_action enum
ALTER TYPE log_action ADD VALUE IF NOT EXISTS 'create_branch';
ALTER TYPE log_action ADD VALUE IF NOT EXISTS 'update_branch';
ALTER TYPE log_action ADD VALUE IF NOT EXISTS 'delete_branch';
ALTER TYPE log_action ADD VALUE IF NOT EXISTS 'create_announcement';
ALTER TYPE log_action ADD VALUE IF NOT EXISTS 'update_announcement';
ALTER TYPE log_action ADD VALUE IF NOT EXISTS 'delete_announcement';
