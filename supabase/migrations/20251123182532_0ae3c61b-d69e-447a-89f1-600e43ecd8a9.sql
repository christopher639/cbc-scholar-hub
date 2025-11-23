-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Enable realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Create function to notify admins
CREATE OR REPLACE FUNCTION public.notify_admins(
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, entity_type, entity_id)
  SELECT 
    user_id,
    p_type,
    p_title,
    p_message,
    p_entity_type,
    p_entity_id
  FROM public.user_roles
  WHERE role = 'admin';
END;
$$;

-- Trigger for payment receipts
CREATE OR REPLACE FUNCTION public.notify_payment_receipt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_learner RECORD;
BEGIN
  SELECT 
    l.first_name,
    l.last_name,
    l.admission_number
  INTO v_learner
  FROM learners l
  WHERE l.id = NEW.learner_id;

  PERFORM notify_admins(
    'payment_receipt',
    'New Payment Received',
    format('Payment of $%s received for %s %s (%s)', 
      NEW.amount_paid::numeric(10,2),
      v_learner.first_name,
      v_learner.last_name,
      v_learner.admission_number
    ),
    'fee_transaction',
    NEW.id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_payment_receipt
AFTER INSERT ON public.fee_transactions
FOR EACH ROW
EXECUTE FUNCTION public.notify_payment_receipt();

-- Trigger for overdue invoices
CREATE OR REPLACE FUNCTION public.notify_overdue_invoices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice RECORD;
  v_overdue_count INTEGER;
BEGIN
  -- Count overdue invoices
  SELECT COUNT(*) INTO v_overdue_count
  FROM student_invoices
  WHERE status = 'overdue'
  AND due_date = CURRENT_DATE - INTERVAL '1 day';

  IF v_overdue_count > 0 THEN
    PERFORM notify_admins(
      'overdue_invoice',
      'Overdue Invoices Alert',
      format('%s invoice(s) became overdue yesterday', v_overdue_count),
      'invoice',
      NULL
    );
  END IF;
END;
$$;

-- Trigger for new learner enrollments
CREATE OR REPLACE FUNCTION public.notify_new_learner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_grade_name TEXT;
BEGIN
  SELECT name INTO v_grade_name
  FROM grades
  WHERE id = NEW.current_grade_id;

  PERFORM notify_admins(
    'new_learner',
    'New Learner Enrolled',
    format('%s %s enrolled in %s (Admission: %s)',
      NEW.first_name,
      NEW.last_name,
      COALESCE(v_grade_name, 'Unknown Grade'),
      NEW.admission_number
    ),
    'learner',
    NEW.id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_new_learner
AFTER INSERT ON public.learners
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION public.notify_new_learner();

-- Trigger for new teacher/staff
CREATE OR REPLACE FUNCTION public.notify_new_teacher()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM notify_admins(
    'new_staff',
    'New Teacher Added',
    format('Teacher %s %s has been added (Employee: %s)',
      NEW.first_name,
      NEW.last_name,
      COALESCE(NEW.employee_number, 'N/A')
    ),
    'teacher',
    NEW.id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_new_teacher
AFTER INSERT ON public.teachers
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_teacher();

CREATE OR REPLACE FUNCTION public.notify_new_non_teaching_staff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM notify_admins(
    'new_staff',
    'New Staff Member Added',
    format('Non-teaching staff %s %s has been added (%s)',
      NEW.first_name,
      NEW.last_name,
      NEW.job_title
    ),
    'non_teaching_staff',
    NEW.id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_new_non_teaching_staff
AFTER INSERT ON public.non_teaching_staff
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_non_teaching_staff();

-- Create index for performance
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);