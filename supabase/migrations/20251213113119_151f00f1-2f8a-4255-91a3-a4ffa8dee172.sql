-- Create fee reminder automation settings table
CREATE TABLE public.fee_reminder_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled boolean NOT NULL DEFAULT false,
  interval_days integer NOT NULL DEFAULT 7,
  last_run_at timestamp with time zone,
  next_run_at timestamp with time zone,
  scope text NOT NULL DEFAULT 'school',
  grade_id uuid REFERENCES public.grades(id),
  include_current_term boolean NOT NULL DEFAULT true,
  include_previous_balance boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fee_reminder_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage fee reminder settings"
  ON public.fee_reminder_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Finance can manage fee reminder settings"
  ON public.fee_reminder_settings FOR ALL
  USING (has_role(auth.uid(), 'finance'::app_role));

-- Insert default settings row
INSERT INTO public.fee_reminder_settings (is_enabled, interval_days, scope)
VALUES (false, 7, 'school');

-- Create trigger for updated_at
CREATE TRIGGER update_fee_reminder_settings_updated_at
  BEFORE UPDATE ON public.fee_reminder_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();