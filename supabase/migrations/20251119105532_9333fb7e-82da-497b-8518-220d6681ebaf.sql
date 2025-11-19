-- Step 1: Add the new 'learner' value to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'learner';