-- Add new columns for UI styling options
ALTER TABLE public.appearance_settings 
ADD COLUMN sidebar_style TEXT DEFAULT 'default',
ADD COLUMN card_style TEXT DEFAULT 'default',
ADD COLUMN hero_gradient TEXT DEFAULT 'primary';

-- Update existing row with default values
UPDATE public.appearance_settings SET
  sidebar_style = 'default',
  card_style = 'default',
  hero_gradient = 'primary'
WHERE sidebar_style IS NULL;