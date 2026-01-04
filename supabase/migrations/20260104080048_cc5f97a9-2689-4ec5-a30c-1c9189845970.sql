
-- Create timetable_entries table
CREATE TABLE public.timetable_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grade_id UUID NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
  stream_id UUID NOT NULL REFERENCES public.streams(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  learning_area_id UUID REFERENCES public.learning_areas(id) ON DELETE SET NULL,
  academic_year TEXT NOT NULL,
  term TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 5),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  entry_type TEXT NOT NULL DEFAULT 'lesson' CHECK (entry_type IN ('lesson', 'double_lesson', 'games', 'cocurricular', 'break', 'lunch', 'assembly')),
  subject_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create index for efficient queries
CREATE INDEX idx_timetable_grade_stream ON public.timetable_entries(grade_id, stream_id, academic_year, term);
CREATE INDEX idx_timetable_teacher ON public.timetable_entries(teacher_id, academic_year, term);
CREATE INDEX idx_timetable_day_time ON public.timetable_entries(day_of_week, start_time, end_time);

-- Enable RLS
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;

-- Admin can manage all timetable entries
CREATE POLICY "Admins can manage timetable entries"
ON public.timetable_entries
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Teachers can view their own timetable entries
CREATE POLICY "Teachers can view their timetable"
ON public.timetable_entries
FOR SELECT
USING (
  teacher_id IN (
    SELECT id FROM public.teachers WHERE user_id = auth.uid()
  )
);

-- Learners can view timetable for their stream
CREATE POLICY "Learners can view their stream timetable"
ON public.timetable_entries
FOR SELECT
USING (
  stream_id IN (
    SELECT current_stream_id FROM public.learners WHERE user_id = auth.uid()
  )
);

-- Visitors can view timetable
CREATE POLICY "Visitors can view timetable"
ON public.timetable_entries
FOR SELECT
USING (has_role(auth.uid(), 'visitor'::app_role));

-- Function to check for teacher conflicts
CREATE OR REPLACE FUNCTION public.check_timetable_teacher_conflict(
  p_teacher_id UUID,
  p_academic_year TEXT,
  p_term TEXT,
  p_day_of_week INTEGER,
  p_start_time TIME,
  p_end_time TIME,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM timetable_entries
    WHERE teacher_id = p_teacher_id
      AND academic_year = p_academic_year
      AND term = p_term
      AND day_of_week = p_day_of_week
      AND (id IS DISTINCT FROM p_exclude_id)
      AND (
        (start_time < p_end_time AND end_time > p_start_time)
      )
  );
END;
$$;

-- Function to check for stream conflicts
CREATE OR REPLACE FUNCTION public.check_timetable_stream_conflict(
  p_stream_id UUID,
  p_academic_year TEXT,
  p_term TEXT,
  p_day_of_week INTEGER,
  p_start_time TIME,
  p_end_time TIME,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM timetable_entries
    WHERE stream_id = p_stream_id
      AND academic_year = p_academic_year
      AND term = p_term
      AND day_of_week = p_day_of_week
      AND (id IS DISTINCT FROM p_exclude_id)
      AND (
        (start_time < p_end_time AND end_time > p_start_time)
      )
  );
END;
$$;

-- Function to clone timetable between terms/years
CREATE OR REPLACE FUNCTION public.clone_timetable(
  p_source_academic_year TEXT,
  p_source_term TEXT,
  p_target_academic_year TEXT,
  p_target_term TEXT,
  p_grade_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO timetable_entries (
    grade_id, stream_id, teacher_id, learning_area_id,
    academic_year, term, day_of_week, start_time, end_time,
    room, entry_type, subject_name
  )
  SELECT 
    grade_id, stream_id, teacher_id, learning_area_id,
    p_target_academic_year, p_target_term, day_of_week, start_time, end_time,
    room, entry_type, subject_name
  FROM timetable_entries
  WHERE academic_year = p_source_academic_year
    AND term = p_source_term
    AND (p_grade_id IS NULL OR grade_id = p_grade_id);
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_timetable_entries_updated_at
BEFORE UPDATE ON public.timetable_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
