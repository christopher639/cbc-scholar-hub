-- Create performance releases table to track when marks are released to learner portal
CREATE TABLE public.performance_releases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  academic_year TEXT NOT NULL,
  term TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  released_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  released_by UUID NOT NULL,
  grade_id UUID REFERENCES public.grades(id),
  stream_id UUID REFERENCES public.streams(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(academic_year, term, exam_type, grade_id, stream_id)
);

-- Enable RLS
ALTER TABLE public.performance_releases ENABLE ROW LEVEL SECURITY;

-- Admin can manage releases
CREATE POLICY "Admins can manage performance releases"
  ON public.performance_releases
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Everyone can view releases (needed for portal to check)
CREATE POLICY "Everyone can view performance releases"
  ON public.performance_releases
  FOR SELECT
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_performance_releases_updated_at
  BEFORE UPDATE ON public.performance_releases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();