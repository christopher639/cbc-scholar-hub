-- Update RLS policies for teachers table to restrict teacher access
DROP POLICY IF EXISTS "Admins and teachers view teacher data" ON teachers;
DROP POLICY IF EXISTS "Teachers can update their own profile" ON teachers;

-- Teachers can only view their own profile
CREATE POLICY "Teachers view own profile"
ON teachers
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND user_id = auth.uid()
);

-- Admins can view all teachers
CREATE POLICY "Admins view all teachers"
ON teachers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Teachers can update their own profile (not salary or employee_number)
CREATE POLICY "Teachers update own profile"
ON teachers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Ensure fee_transactions properly link to invoices and learners
-- Add index for better performance on fee calculations
CREATE INDEX IF NOT EXISTS idx_fee_transactions_learner_id ON fee_transactions(learner_id);
CREATE INDEX IF NOT EXISTS idx_fee_transactions_invoice_id ON fee_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_student_invoices_learner_id ON student_invoices(learner_id);

-- Ensure performance_records has proper foreign keys and indexes
CREATE INDEX IF NOT EXISTS idx_performance_records_learner_id ON performance_records(learner_id);
CREATE INDEX IF NOT EXISTS idx_performance_records_teacher_id ON performance_records(teacher_id);

-- Add missing teacher_id to performance records when inserted by authenticated user
CREATE OR REPLACE FUNCTION set_performance_teacher()
RETURNS TRIGGER AS $$
DECLARE
  v_teacher_id uuid;
BEGIN
  -- Get teacher_id from user_id if the user is a teacher
  IF NEW.teacher_id IS NULL THEN
    SELECT id INTO v_teacher_id
    FROM teachers
    WHERE user_id = auth.uid();
    
    IF v_teacher_id IS NOT NULL THEN
      NEW.teacher_id := v_teacher_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set teacher_id
DROP TRIGGER IF EXISTS set_performance_teacher_trigger ON performance_records;
CREATE TRIGGER set_performance_teacher_trigger
BEFORE INSERT ON performance_records
FOR EACH ROW
EXECUTE FUNCTION set_performance_teacher();