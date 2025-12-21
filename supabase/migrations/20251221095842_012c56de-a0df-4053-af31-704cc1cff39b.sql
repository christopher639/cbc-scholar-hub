-- Add theme column to appearance_settings for comprehensive theme management
ALTER TABLE public.appearance_settings 
ADD COLUMN IF NOT EXISTS app_theme TEXT DEFAULT 'default';

-- Add comment to explain the column
COMMENT ON COLUMN public.appearance_settings.app_theme IS 'Overall application theme that affects sidebar, topbar, dialogs, buttons, and pages';