-- Add previous school information to learners table
ALTER TABLE public.learners 
ADD COLUMN IF NOT EXISTS previous_school TEXT,
ADD COLUMN IF NOT EXISTS previous_grade TEXT,
ADD COLUMN IF NOT EXISTS reason_for_transfer TEXT;

-- Add salary to teachers table
ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS salary NUMERIC;

-- Add missing medical fields to learners if not exists
ALTER TABLE public.learners
ADD COLUMN IF NOT EXISTS allergies TEXT,
ADD COLUMN IF NOT EXISTS blood_type TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS emergency_phone TEXT;