-- Create assignments table for teachers to post assignments to learners
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  learning_area_id UUID NOT NULL REFERENCES learning_areas(id) ON DELETE CASCADE,
  grade_id UUID NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
  stream_id UUID REFERENCES streams(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  total_marks NUMERIC NOT NULL DEFAULT 100,
  academic_year TEXT NOT NULL,
  term term NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assignment submissions table
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  submission_text TEXT,
  file_url TEXT,
  marks_obtained NUMERIC,
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  graded_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, learner_id)
);

-- Enable RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assignments
CREATE POLICY "Teachers can manage their own assignments"
ON public.assignments
FOR ALL
TO authenticated
USING (
  teacher_id IN (
    SELECT id FROM teachers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all assignments"
ON public.assignments
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Learners can view assignments for their grade/stream"
ON public.assignments
FOR SELECT
TO authenticated
USING (
  grade_id IN (
    SELECT current_grade_id FROM learners WHERE id IN (
      SELECT id FROM learners WHERE user_id = auth.uid()
    )
  )
  AND (
    stream_id IS NULL 
    OR stream_id IN (
      SELECT current_stream_id FROM learners WHERE id IN (
        SELECT id FROM learners WHERE user_id = auth.uid()
      )
    )
  )
);

-- RLS Policies for assignment submissions
CREATE POLICY "Teachers can view and grade submissions for their assignments"
ON public.assignment_submissions
FOR ALL
TO authenticated
USING (
  assignment_id IN (
    SELECT id FROM assignments WHERE teacher_id IN (
      SELECT id FROM teachers WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Admins can manage all submissions"
ON public.assignment_submissions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Learners can view and submit their own submissions"
ON public.assignment_submissions
FOR ALL
TO authenticated
USING (
  learner_id IN (
    SELECT id FROM learners WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  learner_id IN (
    SELECT id FROM learners WHERE user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_grade_stream ON assignments(grade_id, stream_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_learner_id ON assignment_submissions(learner_id);

-- Add triggers for updated_at
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignment_submissions_updated_at
  BEFORE UPDATE ON assignment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();