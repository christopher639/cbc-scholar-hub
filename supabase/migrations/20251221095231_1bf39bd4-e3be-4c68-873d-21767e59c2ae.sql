-- Add page_background column to appearance_settings
ALTER TABLE public.appearance_settings 
ADD COLUMN page_background TEXT DEFAULT 'default';