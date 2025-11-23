-- Create learner_sessions table
CREATE TABLE IF NOT EXISTS public.learner_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  last_accessed TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.learner_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for learner_sessions
CREATE POLICY "Learners can view their own sessions"
  ON public.learner_sessions
  FOR SELECT
  USING (learner_id IN (
    SELECT id FROM public.learners WHERE id = learner_id
  ));

CREATE POLICY "Public can insert learner sessions"
  ON public.learner_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can delete expired sessions"
  ON public.learner_sessions
  FOR DELETE
  USING (expires_at < NOW());

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_learner_sessions_token ON public.learner_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_learner_sessions_learner_id ON public.learner_sessions(learner_id);