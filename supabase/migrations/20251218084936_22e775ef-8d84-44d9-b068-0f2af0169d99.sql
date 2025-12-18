
-- Update the employee number generation function to remove special characters
CREATE OR REPLACE FUNCTION public.generate_employee_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_year TEXT;
  next_number BIGINT;
  new_employee_number TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YY');
  
  -- Use nextval to get the next sequence value (atomic operation)
  next_number := nextval('employee_number_seq');
  
  -- Format: EMPYYNNNN (e.g., EMP241001) - no special characters
  new_employee_number := 'EMP' || current_year || LPAD(next_number::TEXT, 4, '0');
  
  RETURN new_employee_number;
END;
$function$;
