-- Drop existing constraint and add updated one with all_teachers option
ALTER TABLE public.bulk_messages DROP CONSTRAINT IF EXISTS bulk_messages_recipient_type_check;

ALTER TABLE public.bulk_messages ADD CONSTRAINT bulk_messages_recipient_type_check 
CHECK (recipient_type = ANY (ARRAY['all'::text, 'grade'::text, 'stream'::text, 'individual'::text, 'all_teachers'::text]));