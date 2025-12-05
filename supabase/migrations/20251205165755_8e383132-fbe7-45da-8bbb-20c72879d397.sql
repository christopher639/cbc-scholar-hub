-- Fix Critical Security Issue: Remove public access to learners table
-- The "Everyone can view learners" policy allows anyone to access sensitive student PII

DROP POLICY IF EXISTS "Everyone can view learners" ON public.learners;

-- The existing restrictive policies will handle proper access:
-- - "Admins can manage learners" - full access for admins
-- - "Teachers can view all learners" - read access for teachers
-- - "Parents can view their children" - restricted to their children only