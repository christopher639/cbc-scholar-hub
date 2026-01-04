-- Add applications_open column to control whether applications are open
ALTER TABLE public.application_settings 
ADD COLUMN IF NOT EXISTS applications_open boolean NOT NULL DEFAULT true;