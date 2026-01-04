-- Add religion column to learners table
ALTER TABLE public.learners ADD COLUMN IF NOT EXISTS religion TEXT;

-- Add religion column to applications table
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS religion TEXT;