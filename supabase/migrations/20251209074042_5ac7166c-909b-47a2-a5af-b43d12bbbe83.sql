-- Add visitor SELECT policies to tables that don't have them yet

-- Check and add visitor policy to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Visitors can view profiles'
  ) THEN
    CREATE POLICY "Visitors can view profiles" ON public.profiles
    FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));
  END IF;
END $$;

-- Add visitor policy to learner_sessions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'learner_sessions' 
    AND policyname = 'Visitors can view learner sessions'
  ) THEN
    CREATE POLICY "Visitors can view learner sessions" ON public.learner_sessions
    FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));
  END IF;
END $$;

-- Add visitor policy to performance_records
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'performance_records' 
    AND policyname = 'Visitors can view performance records'
  ) THEN
    CREATE POLICY "Visitors can view performance records" ON public.performance_records
    FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));
  END IF;
END $$;

-- Add visitor policy to learning_areas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'learning_areas' 
    AND policyname = 'Visitors can view learning areas'
  ) THEN
    CREATE POLICY "Visitors can view learning areas" ON public.learning_areas
    FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));
  END IF;
END $$;

-- Add visitor policy to student_invoices
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'student_invoices' 
    AND policyname = 'Visitors can view student invoices'
  ) THEN
    CREATE POLICY "Visitors can view student invoices" ON public.student_invoices
    FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));
  END IF;
END $$;

-- Add visitor policy to promotion_history
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'promotion_history' 
    AND policyname = 'Visitors can view promotion history'
  ) THEN
    CREATE POLICY "Visitors can view promotion history" ON public.promotion_history
    FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));
  END IF;
END $$;

-- Add visitor policy to parents
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'parents' 
    AND policyname = 'Visitors can view parents'
  ) THEN
    CREATE POLICY "Visitors can view parents" ON public.parents
    FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));
  END IF;
END $$;

-- Add visitor policy to activity_logs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'activity_logs' 
    AND policyname = 'Visitors can view activity logs'
  ) THEN
    CREATE POLICY "Visitors can view activity logs" ON public.activity_logs
    FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));
  END IF;
END $$;

-- Add visitor policy to contact_messages
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contact_messages' 
    AND policyname = 'Visitors can view contact messages'
  ) THEN
    CREATE POLICY "Visitors can view contact messages" ON public.contact_messages
    FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));
  END IF;
END $$;

-- Add visitor policy to notifications
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Visitors can view notifications'
  ) THEN
    CREATE POLICY "Visitors can view notifications" ON public.notifications
    FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));
  END IF;
END $$;

-- Add visitor policy to transfer_records
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'transfer_records' 
    AND policyname = 'Visitors can view transfer records'
  ) THEN
    CREATE POLICY "Visitors can view transfer records" ON public.transfer_records
    FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));
  END IF;
END $$;