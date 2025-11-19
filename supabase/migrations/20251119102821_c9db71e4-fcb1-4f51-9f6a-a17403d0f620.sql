-- Add term and exam_type to performance_records table
ALTER TABLE public.performance_records 
ADD COLUMN IF NOT EXISTS term term,
ADD COLUMN IF NOT EXISTS exam_type TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_performance_records_learner_year_term 
ON public.performance_records(learner_id, academic_year, term);

-- Add comment for exam_type
COMMENT ON COLUMN public.performance_records.exam_type IS 'Type of exam: opener, midterm, endterm, etc.';