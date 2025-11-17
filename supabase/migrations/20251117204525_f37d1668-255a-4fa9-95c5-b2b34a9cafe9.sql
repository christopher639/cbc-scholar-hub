-- Add birth_certificate_number to learners table
ALTER TABLE public.learners 
ADD COLUMN birth_certificate_number TEXT;

-- Create parent_sessions table for managing parent portal sessions
CREATE TABLE public.parent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  last_accessed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on parent_sessions
ALTER TABLE public.parent_sessions ENABLE ROW LEVEL SECURITY;

-- Create messages table for parent-teacher communication
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('parent', 'teacher', 'admin')),
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for parent_sessions (no auth needed as this is custom auth system)
CREATE POLICY "Public can insert parent sessions"
ON public.parent_sessions
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Public can select their own sessions"
ON public.parent_sessions
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Public can delete expired sessions"
ON public.parent_sessions
FOR DELETE
TO anon
USING (true);

-- RLS policies for messages
CREATE POLICY "Parents can view messages for their children"
ON public.messages
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Parents can insert messages"
ON public.messages
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Teachers and admins can view all messages"
ON public.messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers and admins can insert messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create index for better performance
CREATE INDEX idx_parent_sessions_token ON public.parent_sessions(session_token);
CREATE INDEX idx_parent_sessions_learner ON public.parent_sessions(learner_id);
CREATE INDEX idx_messages_learner ON public.messages(learner_id);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);