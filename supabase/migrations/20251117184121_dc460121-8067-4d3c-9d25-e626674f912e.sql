-- Function to generate unique admission number
CREATE OR REPLACE FUNCTION generate_admission_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year TEXT;
  next_number INT;
  new_admission_number TEXT;
BEGIN
  -- Get current year (last 2 digits)
  current_year := TO_CHAR(CURRENT_DATE, 'YY');
  
  -- Get the highest admission number for current year
  SELECT COALESCE(MAX(CAST(SUBSTRING(admission_number FROM 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM learners
  WHERE admission_number LIKE current_year || '%';
  
  -- Format: YYNNNNN (e.g., 2500001 for year 2025, student #1)
  new_admission_number := current_year || LPAD(next_number::TEXT, 5, '0');
  
  RETURN new_admission_number;
END;
$$;

-- Trigger function to auto-assign first user as admin
CREATE OR REPLACE FUNCTION auto_assign_first_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Count existing users in user_roles
  SELECT COUNT(*) INTO user_count FROM user_roles;
  
  -- If this is the first user, make them admin
  IF user_count = 0 THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_first_user_admin ON auth.users;

-- Create trigger to auto-assign admin to first user
CREATE TRIGGER on_first_user_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_first_admin();

-- Update learners table to use auto-generated admission numbers
ALTER TABLE learners 
  ALTER COLUMN admission_number SET DEFAULT generate_admission_number();