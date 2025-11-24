-- Fix parents table RLS policies to allow admin insertions
-- Drop existing policies
DROP POLICY IF EXISTS "Admins have full access to parents" ON public.parents;
DROP POLICY IF EXISTS "Parents can view own profile" ON public.parents;
DROP POLICY IF EXISTS "Parents can update own profile" ON public.parents;

-- Create new policies with proper INSERT support
CREATE POLICY "Admins can view all parents"
ON public.parents
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert parents"
ON public.parents
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update parents"
ON public.parents
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete parents"
ON public.parents
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Parents can view own profile"
ON public.parents
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Parents can update own profile"
ON public.parents
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());