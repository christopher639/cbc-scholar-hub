-- Secure RPC to validate learner credentials without exposing the learners table via public RLS
-- This function runs with SECURITY DEFINER and returns only minimal fields
CREATE OR REPLACE FUNCTION public.validate_learner_credentials(
  _admission text,
  _birth text
)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  admission_number text,
  birth_certificate_number text,
  current_grade_id uuid,
  current_stream_id uuid,
  parent_id uuid,
  photo_url text,
  date_of_birth date
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    first_name,
    last_name,
    admission_number,
    birth_certificate_number,
    current_grade_id,
    current_stream_id,
    parent_id,
    photo_url,
    date_of_birth
  FROM public.learners
  WHERE admission_number = _admission
    AND birth_certificate_number = _birth
  LIMIT 1;
$$;

-- Ensure public can execute the function
GRANT EXECUTE ON FUNCTION public.validate_learner_credentials(text, text) TO anon, authenticated;