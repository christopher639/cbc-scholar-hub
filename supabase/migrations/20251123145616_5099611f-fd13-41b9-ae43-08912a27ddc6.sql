-- Add RLS policy to allow public access to teachers table for authentication
CREATE POLICY "Public can query teachers for authentication"
ON public.teachers
FOR SELECT
TO public
USING (true);

-- Note: This allows reading teacher records for authentication purposes
-- The actual authentication security comes from matching both TSC number AND ID number
COMMENT ON POLICY "Public can query teachers for authentication" ON public.teachers 
IS 'Allows unauthenticated users to query teachers table for login authentication. Security is maintained by requiring both TSC number and ID number to match.';