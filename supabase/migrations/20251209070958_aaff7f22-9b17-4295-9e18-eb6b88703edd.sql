-- Update the assign_user_role function to handle upsert properly
CREATE OR REPLACE FUNCTION public.assign_user_role(p_user_id uuid, p_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete existing role for this user
  DELETE FROM public.user_roles WHERE user_id = p_user_id;
  
  -- Insert the new role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role);
END;
$$;