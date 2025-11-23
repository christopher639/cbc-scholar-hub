-- Fix search_path for set_performance_teacher function
CREATE OR REPLACE FUNCTION set_performance_teacher()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;