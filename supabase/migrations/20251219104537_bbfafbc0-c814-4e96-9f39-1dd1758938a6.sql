-- RPC: return learners for teacher portal using teacher session token (since portal uses custom sessions)
CREATE OR REPLACE FUNCTION public.get_active_learners_for_teacher_session(
  p_session_token text,
  p_grade_id uuid,
  p_stream_id uuid
)
RETURNS TABLE(
  id uuid,
  admission_number text,
  first_name text,
  last_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teacher_id uuid;
BEGIN
  -- Validate session token (must exist and not be expired)
  SELECT ts.teacher_id
  INTO v_teacher_id
  FROM public.teacher_sessions ts
  WHERE ts.session_token = p_session_token
    AND ts.expires_at > now()
  LIMIT 1;

  IF v_teacher_id IS NULL THEN
    -- No valid session
    RETURN;
  END IF;

  RETURN QUERY
  SELECT l.id, l.admission_number, l.first_name, l.last_name
  FROM public.learners l
  WHERE l.status = 'active'
    AND l.current_grade_id = p_grade_id
    AND l.current_stream_id = p_stream_id
  ORDER BY l.admission_number;
END;
$$;

REVOKE ALL ON FUNCTION public.get_active_learners_for_teacher_session(text, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_active_learners_for_teacher_session(text, uuid, uuid) TO anon, authenticated;