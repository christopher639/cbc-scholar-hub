-- Create exam_types table for managing custom exam types
CREATE TABLE public.exam_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exam_types ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Everyone can view active exam types" 
ON public.exam_types 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage exam types" 
ON public.exam_types 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view exam types" 
ON public.exam_types 
FOR SELECT 
USING (has_role(auth.uid(), 'teacher'::app_role));

-- Insert default exam types
INSERT INTO public.exam_types (name, description, display_order) VALUES
('Opener', 'Opening exam at the start of term', 1),
('Mid-Term', 'Mid-term examination', 2),
('End Term', 'End of term examination', 3);

-- Create trigger for updated_at
CREATE TRIGGER update_exam_types_updated_at
BEFORE UPDATE ON public.exam_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();