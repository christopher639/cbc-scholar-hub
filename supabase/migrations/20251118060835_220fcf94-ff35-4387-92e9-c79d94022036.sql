-- Add public session policies for teacher_sessions to match parent_sessions behavior
-- Enable where not already enabled (should already be enabled)
ALTER TABLE public.teacher_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing overly restrictive policy if present to avoid conflicts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'teacher_sessions' AND policyname = 'Teachers can manage their own sessions'
  ) THEN
    DROP POLICY "Teachers can manage their own sessions" ON public.teacher_sessions;
  END IF;
END $$;

-- Allow public inserts (sessions are created by our login flow without an auth user)
CREATE POLICY "Public can insert teacher sessions"
ON public.teacher_sessions
FOR INSERT
TO public
WITH CHECK (true);

-- Allow public select to validate a session by its token and expiry
CREATE POLICY "Public can select teacher sessions"
ON public.teacher_sessions
FOR SELECT
TO public
USING (true);

-- Allow public delete of expired sessions (optional cleanup)
CREATE POLICY "Public can delete expired teacher sessions"
ON public.teacher_sessions
FOR DELETE
TO public
USING (expires_at < now());
