-- Create table for hero background images
CREATE TABLE public.hero_backgrounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hero_backgrounds ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view active hero backgrounds (for public homepage)
CREATE POLICY "Anyone can view active hero backgrounds" 
ON public.hero_backgrounds 
FOR SELECT 
USING (is_active = true);

-- Allow admins to manage hero backgrounds
CREATE POLICY "Admins can manage hero backgrounds" 
ON public.hero_backgrounds 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create trigger for updated_at
CREATE TRIGGER update_hero_backgrounds_updated_at
BEFORE UPDATE ON public.hero_backgrounds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();