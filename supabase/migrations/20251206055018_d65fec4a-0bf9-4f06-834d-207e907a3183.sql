-- Add hero background URL to school_info
ALTER TABLE public.school_info ADD COLUMN IF NOT EXISTS hero_background_url text;

-- Create blogs table
CREATE TABLE public.blogs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  is_published boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Policies for blogs
CREATE POLICY "Everyone can view published blogs" 
ON public.blogs 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can manage blogs" 
ON public.blogs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_blogs_updated_at
BEFORE UPDATE ON public.blogs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();