-- Create gallery_images table
CREATE TABLE public.gallery_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  category text DEFAULT 'general',
  display_order integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage gallery images"
  ON public.gallery_images FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view published gallery images"
  ON public.gallery_images FOR SELECT
  USING (is_published = true);

-- Trigger for updated_at
CREATE TRIGGER update_gallery_images_updated_at
  BEFORE UPDATE ON public.gallery_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();