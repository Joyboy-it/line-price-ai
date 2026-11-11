-- Migration: Add direct-to-factory actions to log_action enum

ALTER TYPE log_action ADD VALUE IF NOT EXISTS 'create_factory_order';
ALTER TYPE log_action ADD VALUE IF NOT EXISTS 'update_factory_order';
ALTER TYPE log_action ADD VALUE IF NOT EXISTS 'cancel_factory_order';
ALTER TYPE log_action ADD VALUE IF NOT EXISTS 'import_agent_offers';
ALTER TYPE log_action ADD VALUE IF NOT EXISTS 'update_factory_settings';
