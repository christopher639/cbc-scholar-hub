-- Add likes_count to blogs table
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

-- Create page_visits table for tracking unique visitors
CREATE TABLE public.page_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id text NOT NULL,
  page_path text NOT NULL DEFAULT '/',
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_page_visits_visitor_id ON public.page_visits(visitor_id);
CREATE INDEX idx_page_visits_page_path ON public.page_visits(page_path);
CREATE INDEX idx_page_visits_visit_date ON public.page_visits(visit_date);

-- Create unique constraint to prevent duplicate visits per visitor per day
ALTER TABLE public.page_visits ADD CONSTRAINT unique_daily_visit UNIQUE(visitor_id, page_path, visit_date);

-- Enable RLS
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert page visits (for tracking)
CREATE POLICY "Anyone can insert page visits" ON public.page_visits
  FOR INSERT WITH CHECK (true);

-- Only admins can view page visits
CREATE POLICY "Admins can view page visits" ON public.page_visits
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Create blog_likes table to track who liked what
CREATE TABLE public.blog_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id uuid NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(blog_id, visitor_id)
);

-- Enable RLS
ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert/delete likes
CREATE POLICY "Anyone can like blogs" ON public.blog_likes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view likes" ON public.blog_likes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can unlike blogs" ON public.blog_likes
  FOR DELETE USING (true);

-- Create function to update likes count
CREATE OR REPLACE FUNCTION public.update_blog_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE blogs SET likes_count = likes_count + 1 WHERE id = NEW.blog_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE blogs SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.blog_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for likes count
CREATE TRIGGER trigger_update_blog_likes_count
AFTER INSERT OR DELETE ON public.blog_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_blog_likes_count();

-- Create function to get unique visitor count
CREATE OR REPLACE FUNCTION public.get_unique_visitor_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT visitor_id)::integer FROM page_visits WHERE page_path = '/';
$$;