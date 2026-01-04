-- Add residence column to applications table
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS residence TEXT;