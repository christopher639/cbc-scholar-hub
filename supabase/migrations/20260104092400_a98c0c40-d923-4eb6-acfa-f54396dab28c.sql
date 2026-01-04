
-- Create application settings table
CREATE TABLE public.application_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fee_enabled boolean NOT NULL DEFAULT false,
  fee_amount numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.application_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for application_settings
CREATE POLICY "Everyone can view application settings" 
ON public.application_settings FOR SELECT USING (true);

CREATE POLICY "Admins can manage application settings" 
ON public.application_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.application_settings (fee_enabled, fee_amount) VALUES (false, 0);

-- Create applications table
CREATE TABLE public.applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Applicant (child) info
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender text NOT NULL,
  birth_certificate_number text,
  previous_school text,
  previous_grade text,
  -- Parent/Guardian info
  parent_first_name text NOT NULL,
  parent_last_name text NOT NULL,
  parent_email text NOT NULL,
  parent_phone text NOT NULL,
  parent_occupation text,
  parent_address text,
  -- Academic info
  applying_for_grade_id uuid REFERENCES public.grades(id),
  applying_for_grade_name text NOT NULL,
  boarding_status text NOT NULL DEFAULT 'day',
  -- Medical info
  medical_info text,
  allergies text,
  blood_type text,
  emergency_contact text,
  emergency_phone text,
  -- Application status
  status text NOT NULL DEFAULT 'pending',
  application_number text NOT NULL,
  fee_paid boolean NOT NULL DEFAULT false,
  fee_amount numeric DEFAULT 0,
  payment_reference text,
  -- Review info
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  review_notes text,
  rejection_reason text,
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- RLS policies for applications
CREATE POLICY "Anyone can submit applications" 
ON public.applications FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all applications" 
ON public.applications FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update applications" 
ON public.applications FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete applications" 
ON public.applications FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Visitors can view applications" 
ON public.applications FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));

-- Create function to generate application number
CREATE OR REPLACE FUNCTION public.generate_application_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year TEXT;
  next_number BIGINT;
  new_app_number TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(application_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM applications
  WHERE application_number LIKE 'APP-' || current_year || '%';
  
  new_app_number := 'APP-' || current_year || '-' || LPAD(next_number::TEXT, 5, '0');
  
  RETURN new_app_number;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_application_settings_updated_at
BEFORE UPDATE ON public.application_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
