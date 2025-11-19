-- Fix 1: Restrict teacher data access to admins and individual teachers only
DROP POLICY IF EXISTS "Everyone can view teachers" ON public.teachers;

CREATE POLICY "Admins and teachers view teacher data"
ON public.teachers FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  user_id = auth.uid()
);

-- Fix 2: Secure parent_sessions - remove public SELECT, validate via server-side only
DROP POLICY IF EXISTS "Public can select their own sessions" ON public.parent_sessions;

CREATE POLICY "Session validation only"
ON public.parent_sessions FOR SELECT
USING (
  -- Only allow selecting specific session by token match
  -- This should be called from SECURITY DEFINER functions, not directly
  learner_id IN (
    SELECT l.id FROM learners l
    JOIN parents p ON p.id = l.parent_id
    WHERE p.user_id = auth.uid()
  )
);

-- Fix 3: Secure teacher_sessions - remove public SELECT
DROP POLICY IF EXISTS "Public can select teacher sessions" ON public.teacher_sessions;

CREATE POLICY "Teachers view their own sessions"
ON public.teacher_sessions FOR SELECT
USING (
  teacher_id IN (
    SELECT id FROM teachers WHERE user_id = auth.uid()
  )
);

-- Fix 4: Secure messages INSERT - require proper authentication
DROP POLICY IF EXISTS "Parents can insert messages" ON public.messages;

CREATE POLICY "Authenticated parents can insert messages"
ON public.messages FOR INSERT
WITH CHECK (
  -- Verify sender is authenticated parent of the learner
  EXISTS (
    SELECT 1 FROM learners l
    JOIN parents p ON p.id = l.parent_id
    WHERE l.id = messages.learner_id
      AND p.user_id = auth.uid()
      AND sender_type = 'parent'
  )
  OR
  -- Or authenticated teacher/admin
  (
    (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
    AND sender_type IN ('teacher', 'admin')
  )
);