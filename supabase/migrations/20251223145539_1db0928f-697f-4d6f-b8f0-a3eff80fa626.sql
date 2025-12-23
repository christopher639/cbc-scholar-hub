-- Add 2FA method column to school_info table
ALTER TABLE public.school_info 
ADD COLUMN IF NOT EXISTS two_factor_method text DEFAULT 'both' CHECK (two_factor_method IN ('sms', 'email', 'both'));