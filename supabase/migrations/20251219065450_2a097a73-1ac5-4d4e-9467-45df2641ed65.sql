-- Table for grade-level learning area registration
CREATE TABLE public.grade_learning_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grade_id UUID NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
  learning_area_id UUID NOT NULL REFERENCES public.learning_areas(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(grade_id, learning_area_id, academic_year)
);

-- Table for individual learner learning area registration
CREATE TABLE public.learner_learning_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  learning_area_id UUID NOT NULL REFERENCES public.learning_areas(id) ON DELETE CASCADE,
  grade_id UUID NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  is_optional BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(learner_id, learning_area_id, academic_year)
);

-- Enable RLS
ALTER TABLE public.grade_learning_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_learning_areas ENABLE ROW LEVEL SECURITY;

-- RLS policies for grade_learning_areas
CREATE POLICY "Admins can manage grade learning areas"
ON public.grade_learning_areas
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view grade learning areas"
ON public.grade_learning_areas
FOR SELECT
USING (true);

CREATE POLICY "Teachers can view grade learning areas"
ON public.grade_learning_areas
FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role));

-- RLS policies for learner_learning_areas
CREATE POLICY "Admins can manage learner learning areas"
ON public.learner_learning_areas
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view learner learning areas"
ON public.learner_learning_areas
FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Everyone can view learner learning areas"
ON public.learner_learning_areas
FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_grade_learning_areas_updated_at
BEFORE UPDATE ON public.grade_learning_areas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learner_learning_areas_updated_at
BEFORE UPDATE ON public.learner_learning_areas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();