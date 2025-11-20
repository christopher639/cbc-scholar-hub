-- Fix the generate_invoice_number function to be safer against concurrent calls
-- by using a sequence-based approach instead of MAX()

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_year TEXT;
  next_number BIGINT;
  new_invoice_number TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Use nextval to get the next sequence value (atomic operation)
  next_number := nextval('invoice_number_seq');
  
  -- Format: INV-YYYY-NNNNNN
  new_invoice_number := 'INV-' || current_year || '-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN new_invoice_number;
END;
$$;