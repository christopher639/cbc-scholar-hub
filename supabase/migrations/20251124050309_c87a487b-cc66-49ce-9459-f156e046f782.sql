-- Fix performance_records RLS policies to allow both admins and teachers to insert/update

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all performance records" ON performance_records;
DROP POLICY IF EXISTS "Teachers can manage performance records" ON performance_records;

-- Create new combined policies that explicitly allow both INSERT and UPDATE for admins and teachers
CREATE POLICY "Admins and teachers can insert performance records"
ON performance_records
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Admins and teachers can update performance records"
ON performance_records
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher')
)
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher')
);

CREATE POLICY "Admins and teachers can delete performance records"
ON performance_records
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher')
);

-- Ensure the trigger exists to auto-set teacher_id
DROP TRIGGER IF EXISTS set_performance_teacher_trigger ON performance_records;

CREATE TRIGGER set_performance_teacher_trigger
BEFORE INSERT ON performance_records
FOR EACH ROW
EXECUTE FUNCTION set_performance_teacher();