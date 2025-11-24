-- Drop the old unique constraint that's causing duplicate errors
ALTER TABLE performance_records 
DROP CONSTRAINT IF EXISTS performance_records_learner_id_learning_area_id_academic_pe_key;

-- Create new unique constraint that allows multiple exam types per learner/area/period
-- This allows admin to record opener, midterm, and final separately
ALTER TABLE performance_records
ADD CONSTRAINT performance_records_unique_exam_type
UNIQUE (learner_id, learning_area_id, academic_year, term, exam_type, grade_id);