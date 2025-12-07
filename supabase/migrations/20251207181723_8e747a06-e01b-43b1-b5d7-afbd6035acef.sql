-- Add is_activated column to profiles table for user activation workflow
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_activated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS activation_status text DEFAULT 'pending';

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.is_activated IS 'Whether the user has been activated by admin';
COMMENT ON COLUMN public.profiles.activation_status IS 'pending, activated, or denied';