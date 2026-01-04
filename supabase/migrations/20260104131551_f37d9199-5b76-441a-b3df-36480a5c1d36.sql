-- Add relationship column to applications table
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS parent_relationship TEXT;

-- Add relationship column to parents table
ALTER TABLE public.parents ADD COLUMN IF NOT EXISTS relationship TEXT;