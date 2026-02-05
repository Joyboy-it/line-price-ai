-- Migration: Change branch_id from UUID to TEXT to support multiple branches (comma-separated)
-- This allows price groups to be associated with multiple branches

-- Step 1: Add new column as TEXT
ALTER TABLE price_groups ADD COLUMN branch_id_new TEXT;

-- Step 2: Copy existing data (convert UUID to TEXT)
UPDATE price_groups SET branch_id_new = branch_id::TEXT WHERE branch_id IS NOT NULL;

-- Step 3: Drop old column
ALTER TABLE price_groups DROP COLUMN branch_id;

-- Step 4: Rename new column to branch_id
ALTER TABLE price_groups RENAME COLUMN branch_id_new TO branch_id;

-- Note: branch_id can now store:
-- - NULL (no branch restriction)
-- - Single UUID as text (e.g., '123e4567-e89b-12d3-a456-426614174000')
-- - Multiple UUIDs comma-separated (e.g., 'uuid1,uuid2,uuid3')
