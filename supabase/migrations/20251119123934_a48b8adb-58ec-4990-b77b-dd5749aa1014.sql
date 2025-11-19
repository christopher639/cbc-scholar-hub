-- Add status field to learners table for alumni and transfer tracking
ALTER TABLE public.learners 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'alumni', 'transferred'));

-- Add is_last_grade field to grades table
ALTER TABLE public.grades 
ADD COLUMN IF NOT EXISTS is_last_grade boolean DEFAULT false;

-- Create alumni table to track graduation details
CREATE TABLE IF NOT EXISTS public.alumni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  graduation_year text NOT NULL,
  graduation_date date NOT NULL DEFAULT CURRENT_DATE,
  final_grade_id uuid REFERENCES public.grades(id),
  final_stream_id uuid REFERENCES public.streams(id),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(learner_id)
);

-- Enable RLS on alumni table
ALTER TABLE public.alumni ENABLE ROW LEVEL SECURITY;

-- RLS policies for alumni table
CREATE POLICY "Admins can manage alumni"
ON public.alumni
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view alumni"
ON public.alumni
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role));

-- Create transfer records table
CREATE TABLE IF NOT EXISTS public.transfer_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  transfer_date date NOT NULL DEFAULT CURRENT_DATE,
  destination_school text NOT NULL,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(learner_id)
);

-- Enable RLS on transfer_records table
ALTER TABLE public.transfer_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for transfer_records
CREATE POLICY "Admins can manage transfer records"
ON public.transfer_records
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view transfer records"
ON public.transfer_records
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role));