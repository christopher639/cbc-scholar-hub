-- Fix the unique constraint for performance records upsert
-- Drop the partial index (with WHERE clause) as it can't be used for upsert
DROP INDEX IF EXISTS performance_records_unique_idx;

-- Create a regular unique index without WHERE clause
-- This allows upsert to work properly
CREATE UNIQUE INDEX performance_records_unique_idx 
ON performance_records (learner_id, learning_area_id, academic_year, term, exam_type, grade_id);

-- Note: This means we need to ensure exam_type is always set when inserting
-- NULL values in exam_type will be treated as distinct from each other