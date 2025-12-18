-- Create a sequence for employee numbers
CREATE SEQUENCE IF NOT EXISTS employee_number_seq START WITH 1001;

-- Create function to generate employee number
CREATE OR REPLACE FUNCTION public.generate_employee_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_year TEXT;
  next_number BIGINT;
  new_employee_number TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YY');
  
  -- Use nextval to get the next sequence value (atomic operation)
  next_number := nextval('employee_number_seq');
  
  -- Format: EMP-YY-NNNN (e.g., EMP-24-1001)
  new_employee_number := 'EMP-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN new_employee_number;
END;
$$;