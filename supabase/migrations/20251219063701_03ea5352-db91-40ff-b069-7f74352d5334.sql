-- Add max_marks column to exam_types table
ALTER TABLE public.exam_types ADD COLUMN IF NOT EXISTS max_marks integer NOT NULL DEFAULT 100;

-- Create grading_scales table for configurable grading system
CREATE TABLE public.grading_scales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grade_name text NOT NULL,
  min_percentage numeric NOT NULL,
  max_percentage numeric NOT NULL,
  points numeric DEFAULT 0,
  description text,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE public.grading_scales IS 'Configurable grading scale for the school';

-- Enable RLS
ALTER TABLE public.grading_scales ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage grading scales" ON public.grading_scales
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view grading scales" ON public.grading_scales
  FOR SELECT USING (true);

CREATE POLICY "Teachers can view grading scales" ON public.grading_scales
  FOR SELECT USING (has_role(auth.uid(), 'teacher'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_grading_scales_updated_at
  BEFORE UPDATE ON public.grading_scales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default grading scale
INSERT INTO public.grading_scales (grade_name, min_percentage, max_percentage, points, description, display_order) VALUES
  ('E.E', 80, 100, 1, 'Exceeding Expectations', 1),
  ('M.E', 60, 79, 2, 'Meeting Expectations', 2),
  ('A.E', 40, 59, 3, 'Approaching Expectations', 3),
  ('B.E', 0, 39, 4, 'Below Expectations', 4);