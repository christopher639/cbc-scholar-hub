-- Create houses table for learners
CREATE TABLE public.houses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create departments table for teachers
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add house_id to learners table (optional)
ALTER TABLE public.learners ADD COLUMN house_id UUID REFERENCES public.houses(id) ON DELETE SET NULL;

-- Add department_id to teachers table (optional)
ALTER TABLE public.teachers ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- Enable RLS on houses
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;

-- Enable RLS on departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- RLS policies for houses
CREATE POLICY "Admins can manage houses" ON public.houses FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view houses" ON public.houses FOR SELECT USING (true);

-- RLS policies for departments
CREATE POLICY "Admins can manage departments" ON public.departments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view departments" ON public.departments FOR SELECT USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_houses_updated_at BEFORE UPDATE ON public.houses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();