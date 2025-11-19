-- Fix RLS policies on parents table to allow smooth data insertion
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage parents" ON public.parents;
DROP POLICY IF EXISTS "Admins can view all parents" ON public.parents;
DROP POLICY IF EXISTS "Parents can update their own profile" ON public.parents;
DROP POLICY IF EXISTS "Parents can view their own profile" ON public.parents;

-- Create comprehensive policies for parents table
-- Admins can do everything
CREATE POLICY "Admins have full access to parents"
ON public.parents
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Parents can view their own profile
CREATE POLICY "Parents can view own profile"
ON public.parents
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Parents can update their own profile
CREATE POLICY "Parents can update own profile"
ON public.parents
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());