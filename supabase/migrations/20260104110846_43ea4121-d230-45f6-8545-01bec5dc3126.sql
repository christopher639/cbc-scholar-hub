-- Add interview settings to application_settings table
ALTER TABLE public.application_settings
ADD COLUMN interview_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN interview_date date NULL,
ADD COLUMN interview_time text NULL,
ADD COLUMN interview_location text NULL,
ADD COLUMN interview_requirements text NULL,
ADD COLUMN interview_fee numeric NULL DEFAULT 0,
ADD COLUMN interview_fee_note text NULL DEFAULT 'This fee is non-refundable';

-- Add comment for clarity
COMMENT ON COLUMN public.application_settings.interview_enabled IS 'Whether interview is required as part of application process';
COMMENT ON COLUMN public.application_settings.interview_fee IS 'Fee charged for interview (non-refundable)';
COMMENT ON COLUMN public.application_settings.interview_fee_note IS 'Note about interview fee (e.g., non-refundable notice)';