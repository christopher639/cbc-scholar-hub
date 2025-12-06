-- Create a function to get active learner count (public access)
CREATE OR REPLACE FUNCTION public.get_active_learner_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM learners WHERE status = 'active';
$$;