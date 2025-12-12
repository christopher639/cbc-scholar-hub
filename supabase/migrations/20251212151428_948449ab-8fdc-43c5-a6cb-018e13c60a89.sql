-- Add two_factor_enabled to school_info for system-wide 2FA setting
ALTER TABLE public.school_info 
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false;