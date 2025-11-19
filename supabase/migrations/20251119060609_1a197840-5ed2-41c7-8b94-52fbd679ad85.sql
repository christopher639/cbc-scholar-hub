-- Add boarding_status enum type
CREATE TYPE public.boarding_status AS ENUM ('day_scholar', 'boarder');

-- Add boarding_status column to learners table
ALTER TABLE public.learners 
ADD COLUMN boarding_status public.boarding_status DEFAULT 'day_scholar' NOT NULL;

-- Create fee_balances table to track fees across grade promotions
CREATE TABLE public.fee_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  grade_id UUID NOT NULL REFERENCES public.grades(id),
  academic_year TEXT NOT NULL,
  term public.term NOT NULL,
  total_fees NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(learner_id, grade_id, academic_year, term)
);

-- Enable RLS on fee_balances
ALTER TABLE public.fee_balances ENABLE ROW LEVEL SECURITY;

-- RLS policies for fee_balances
CREATE POLICY "Admins can manage fee balances"
ON public.fee_balances FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Parents can view their children's fee balances"
ON public.fee_balances FOR SELECT
USING (
  learner_id IN (
    SELECT l.id FROM learners l
    WHERE l.parent_id IN (
      SELECT p.id FROM parents p WHERE p.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Students can view their own fee balances"
ON public.fee_balances FOR SELECT
USING (
  learner_id IN (
    SELECT id FROM learners WHERE user_id = auth.uid()
  )
);

-- Create trigger to update fee_balances updated_at
CREATE TRIGGER update_fee_balances_updated_at
BEFORE UPDATE ON public.fee_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create bulk_messages table for communication tracking
CREATE TABLE public.bulk_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  message_type TEXT NOT NULL CHECK (message_type IN ('email', 'sms', 'both')),
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('all', 'grade', 'stream', 'individual')),
  grade_id UUID REFERENCES public.grades(id),
  stream_id UUID REFERENCES public.streams(id),
  subject TEXT,
  message TEXT NOT NULL,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

-- Enable RLS on bulk_messages
ALTER TABLE public.bulk_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for bulk_messages
CREATE POLICY "Admins can manage bulk messages"
ON public.bulk_messages FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view bulk messages"
ON public.bulk_messages FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role));