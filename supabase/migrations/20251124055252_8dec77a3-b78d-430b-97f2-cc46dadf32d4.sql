-- Drop any unique constraint that might prevent multiple exam types for same learner/learning_area/term/year
-- This allows teachers to record opener, mid-term, and final exams separately

DO $$ 
BEGIN
  -- Check and drop unique constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'performance_records_learner_learning_area_term_key'
  ) THEN
    ALTER TABLE performance_records 
    DROP CONSTRAINT performance_records_learner_learning_area_term_key;
  END IF;

  -- Check and drop similar constraints that might exist
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname LIKE 'performance_records%unique%'
    AND conrelid = 'performance_records'::regclass
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE performance_records DROP CONSTRAINT ' || conname
      FROM pg_constraint 
      WHERE conname LIKE 'performance_records%unique%'
      AND conrelid = 'performance_records'::regclass
      LIMIT 1
    );
  END IF;
END $$;

-- Create a unique constraint that includes exam_type to allow multiple records
-- This ensures each learner can have one record per exam type in each term
CREATE UNIQUE INDEX IF NOT EXISTS performance_records_unique_idx 
ON performance_records (learner_id, learning_area_id, academic_year, term, exam_type, grade_id)
WHERE exam_type IS NOT NULL;

-- Ensure RLS policies allow teachers to insert records
-- Drop and recreate the INSERT policy to be explicit
DROP POLICY IF EXISTS "Admins and teachers can insert performance records" ON performance_records;

CREATE POLICY "Teachers and admins can insert performance records"
ON performance_records
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  (
    has_role(auth.uid(), 'teacher'::app_role)
    AND learning_area_id IN (
      SELECT id FROM learning_areas 
      WHERE teacher_id IN (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    )
  )
);