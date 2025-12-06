-- Create contact_messages table for visitor inquiries
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow public to insert messages (visitors can submit)
CREATE POLICY "Anyone can submit contact messages"
ON public.contact_messages
FOR INSERT
WITH CHECK (true);

-- Only admins can view/manage messages
CREATE POLICY "Admins can manage contact messages"
ON public.contact_messages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_contact_messages_updated_at
BEFORE UPDATE ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Notify admins when new message is received
CREATE OR REPLACE FUNCTION public.notify_new_contact_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM notify_admins(
    'contact_message',
    'New Contact Message',
    format('New message from %s: %s', NEW.name, LEFT(NEW.message, 50) || '...'),
    'contact_message',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_contact_message
AFTER INSERT ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_contact_message();