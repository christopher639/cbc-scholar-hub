-- Add status column to teachers table for tracking transferred teachers
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Update any existing teachers to have 'active' status
UPDATE public.teachers SET status = 'active' WHERE status IS NULL;