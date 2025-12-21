-- Create appearance_settings table to store school theme customization
CREATE TABLE public.appearance_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  primary_color TEXT NOT NULL DEFAULT '210 85% 45%',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appearance_settings ENABLE ROW LEVEL SECURITY;

-- Create policies - everyone can read (to apply theme), only admins can update
CREATE POLICY "Anyone can view appearance settings"
ON public.appearance_settings
FOR SELECT
USING (true);

CREATE POLICY "Only admins can update appearance settings"
ON public.appearance_settings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can insert appearance settings"
ON public.appearance_settings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insert default settings row
INSERT INTO public.appearance_settings (primary_color)
VALUES ('210 85% 45%');

-- Create trigger to update updated_at
CREATE TRIGGER update_appearance_settings_updated_at
BEFORE UPDATE ON public.appearance_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();