-- Add photo_url to teachers table if not exists
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add payment method fields to school_info
ALTER TABLE school_info 
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_branch TEXT,
ADD COLUMN IF NOT EXISTS mpesa_paybill TEXT,
ADD COLUMN IF NOT EXISTS mpesa_account_name TEXT,
ADD COLUMN IF NOT EXISTS payment_instructions TEXT;

-- Create non_teaching_staff table
CREATE TABLE IF NOT EXISTS non_teaching_staff (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  employee_number TEXT UNIQUE,
  id_number TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  job_title TEXT NOT NULL,
  department TEXT,
  hired_date DATE,
  salary NUMERIC,
  photo_url TEXT,
  address TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  status TEXT DEFAULT 'active',
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for non_teaching_staff
ALTER TABLE non_teaching_staff ENABLE ROW LEVEL SECURITY;

-- RLS Policies for non_teaching_staff
CREATE POLICY "Admins can manage non-teaching staff"
ON non_teaching_staff
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Non-teaching staff can view their own profile"
ON non_teaching_staff
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_non_teaching_staff_updated_at
BEFORE UPDATE ON non_teaching_staff
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to check if grade has learners
CREATE OR REPLACE FUNCTION check_grade_has_learners(grade_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM learners 
    WHERE current_grade_id = grade_id
  );
$$;

-- Function to check if stream has learners
CREATE OR REPLACE FUNCTION check_stream_has_learners(stream_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM learners 
    WHERE current_stream_id = stream_id
  );
$$;

-- Create trigger function to prevent grade deletion if it has learners
CREATE OR REPLACE FUNCTION prevent_grade_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF check_grade_has_learners(OLD.id) THEN
    RAISE EXCEPTION 'Cannot delete grade: It has learners assigned to it';
  END IF;
  RETURN OLD;
END;
$$;

-- Create trigger function to prevent stream deletion if it has learners
CREATE OR REPLACE FUNCTION prevent_stream_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF check_stream_has_learners(OLD.id) THEN
    RAISE EXCEPTION 'Cannot delete stream: It has learners assigned to it';
  END IF;
  RETURN OLD;
END;
$$;

-- Add triggers to grades and streams
DROP TRIGGER IF EXISTS prevent_grade_deletion_trigger ON grades;
CREATE TRIGGER prevent_grade_deletion_trigger
BEFORE DELETE ON grades
FOR EACH ROW
EXECUTE FUNCTION prevent_grade_deletion();

DROP TRIGGER IF EXISTS prevent_stream_deletion_trigger ON streams;
CREATE TRIGGER prevent_stream_deletion_trigger
BEFORE DELETE ON streams
FOR EACH ROW
EXECUTE FUNCTION prevent_stream_deletion();