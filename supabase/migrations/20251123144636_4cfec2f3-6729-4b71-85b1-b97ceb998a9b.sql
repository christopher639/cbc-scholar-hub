-- Add TSC number field to teachers table
ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS tsc_number text UNIQUE;

-- Add index for faster TSC number lookups
CREATE INDEX IF NOT EXISTS idx_teachers_tsc_number ON public.teachers(tsc_number);

-- Add comment to explain the field
COMMENT ON COLUMN public.teachers.tsc_number IS 'Teachers Service Commission number used for login authentication';