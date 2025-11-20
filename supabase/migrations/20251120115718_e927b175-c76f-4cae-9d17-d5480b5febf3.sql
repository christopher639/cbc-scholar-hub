-- Create admission number settings table
CREATE TABLE IF NOT EXISTS public.admission_number_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prefix TEXT DEFAULT '',
  current_number INTEGER NOT NULL DEFAULT 1,
  padding INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admission_number_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage admission number settings
CREATE POLICY "Admins can manage admission number settings"
  ON public.admission_number_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Everyone can view admission number settings
CREATE POLICY "Everyone can view admission number settings"
  ON public.admission_number_settings
  FOR SELECT
  USING (true);

-- Insert default settings if none exist
INSERT INTO public.admission_number_settings (prefix, current_number, padding)
VALUES ('', 1, 4)
ON CONFLICT DO NOTHING;

-- Update the generate_admission_number function to use settings
CREATE OR REPLACE FUNCTION public.generate_admission_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  settings RECORD;
  next_number INTEGER;
  admission_num TEXT;
BEGIN
  -- Get current settings
  SELECT * INTO settings FROM admission_number_settings LIMIT 1;
  
  -- If no settings exist, create default
  IF settings IS NULL THEN
    INSERT INTO admission_number_settings (prefix, current_number, padding)
    VALUES ('', 1, 4)
    RETURNING * INTO settings;
  END IF;
  
  -- Get next number and update
  next_number := settings.current_number;
  
  UPDATE admission_number_settings
  SET current_number = current_number + 1,
      updated_at = now()
  WHERE id = settings.id;
  
  -- Format admission number with padding
  admission_num := settings.prefix || LPAD(next_number::TEXT, settings.padding, '0');
  
  RETURN admission_num;
END;
$$;