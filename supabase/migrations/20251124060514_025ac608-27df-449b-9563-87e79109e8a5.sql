-- Fix RLS policies for performance_records to allow teacher inserts
-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Teachers and admins can insert performance records" ON performance_records;

-- Create a new INSERT policy that works correctly
-- Teachers can insert records for their assigned learning areas
CREATE POLICY "Teachers and admins can insert performance records"
ON performance_records
FOR INSERT
TO authenticated
WITH CHECK (
  -- Admins can insert any record
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Teachers can insert records for learning areas they teach
  (
    has_role(auth.uid(), 'teacher'::app_role)
    AND EXISTS (
      SELECT 1 FROM learning_areas la
      INNER JOIN teachers t ON la.teacher_id = t.id
      WHERE la.id = performance_records.learning_area_id
      AND t.user_id = auth.uid()
    )
  )
);