-- Create programs table
CREATE TABLE public.programs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  icon text DEFAULT 'BookOpen',
  color text DEFAULT 'bg-blue-500/10 text-blue-600',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage programs"
ON public.programs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view active programs"
ON public.programs
FOR SELECT
USING (is_active = true);

-- Create function to check if any admin users exist
CREATE OR REPLACE FUNCTION public.count_admin_users()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.user_roles WHERE role = 'admin'::app_role;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_programs_updated_at
BEFORE UPDATE ON public.programs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();