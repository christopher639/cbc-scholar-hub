-- Drop existing restrictive SELECT policy on learner_sessions
DROP POLICY IF EXISTS "Learners can view their own sessions" ON public.learner_sessions;

-- Create a more permissive SELECT policy for session validation
-- This allows reading sessions for validation purposes
CREATE POLICY "Public can validate sessions" 
ON public.learner_sessions 
FOR SELECT 
USING (true);

-- Update the policy to allow session token-based lookups
CREATE POLICY "Public can update session last_accessed" 
ON public.learner_sessions 
FOR UPDATE 
USING (true)
WITH CHECK (true);