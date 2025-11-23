-- Update RLS policy for learners table to allow public read access
-- This is needed because learners use custom session authentication, not Supabase Auth
DROP POLICY IF EXISTS "Students can view their own profile" ON learners;
DROP POLICY IF EXISTS "Everyone can view learners" ON learners;

CREATE POLICY "Everyone can view learners"
ON learners
FOR SELECT
USING (true);