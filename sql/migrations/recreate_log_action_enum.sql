-- Migration: Recreate log_action ENUM with all new values
-- WARNING: This will temporarily affect the user_logs table
-- Use this ONLY if you need to completely recreate the enum

-- Step 1: Create a temporary column
ALTER TABLE user_logs ADD COLUMN action_temp VARCHAR(50);

-- Step 2: Copy existing data to temp column
UPDATE user_logs SET action_temp = action::text;

-- Step 3: Drop the old column
ALTER TABLE user_logs DROP COLUMN action;

-- Step 4: Drop the old enum type
DROP TYPE log_action;

-- Step 5: Create the new enum type with all values
CREATE TYPE log_action AS ENUM (
  'login', 'logout', 'register',
  'upload_image', 'delete_image',
  'create_group', 'update_group', 'delete_group',
  'create_branch', 'update_branch', 'delete_branch',
  'create_announcement', 'update_announcement', 'delete_announcement',
  'approve_request', 'reject_request',
  'update_user', 'delete_user'
);

-- Step 6: Add the column back with the new enum type
ALTER TABLE user_logs ADD COLUMN action log_action;

-- Step 7: Copy data back from temp column
UPDATE user_logs SET action = action_temp::log_action;

-- Step 8: Make the column NOT NULL
ALTER TABLE user_logs ALTER COLUMN action SET NOT NULL;

-- Step 9: Drop the temporary column
ALTER TABLE user_logs DROP COLUMN action_temp;

-- Done! The enum has been recreated with all new values
