-- Fix the generate_application_number function to correctly parse the format APP-YYYY-NNNNN
CREATE OR REPLACE FUNCTION public.generate_application_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_year TEXT;
  next_number BIGINT;
  new_app_number TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- The format is APP-YYYY-NNNNN, so we need to extract the last 5 digits after the second hyphen
  SELECT COALESCE(MAX(CAST(SUBSTRING(application_number FROM 10) AS INTEGER)), 0) + 1
  INTO next_number
  FROM applications
  WHERE application_number LIKE 'APP-' || current_year || '-%';
  
  new_app_number := 'APP-' || current_year || '-' || LPAD(next_number::TEXT, 5, '0');
  
  RETURN new_app_number;
END;
$function$;