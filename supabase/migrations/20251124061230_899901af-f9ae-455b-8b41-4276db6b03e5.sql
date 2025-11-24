-- Fix unique constraint to allow multiple exam types per learner/area/term
-- Drop the old unique index that doesn't include exam_type
DROP INDEX IF EXISTS performance_records_learner_id_learning_area_id_academic_key;

-- Create new unique index that includes exam_type
-- This allows multiple records for opener, midterm, final for same learner/area/term
CREATE UNIQUE INDEX performance_records_unique_per_exam 
ON performance_records(learner_id, learning_area_id, academic_year, term, exam_type, grade_id);