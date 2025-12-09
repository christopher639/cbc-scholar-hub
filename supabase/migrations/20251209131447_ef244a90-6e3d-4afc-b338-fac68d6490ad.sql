-- Create mpesa_transactions table to track M-Pesa payments
CREATE TABLE public.mpesa_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checkout_request_id TEXT,
  merchant_request_id TEXT,
  transaction_id TEXT,
  transaction_type TEXT,
  phone_number TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  account_reference TEXT NOT NULL,
  learner_id UUID REFERENCES public.learners(id),
  invoice_id UUID REFERENCES public.student_invoices(id),
  status TEXT NOT NULL DEFAULT 'pending',
  mpesa_receipt_number TEXT,
  transaction_date TEXT,
  payer_name TEXT,
  result_code INTEGER,
  result_desc TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mpesa_transactions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all M-Pesa transactions
CREATE POLICY "Admins can manage mpesa transactions" 
ON public.mpesa_transactions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Finance can manage M-Pesa transactions
CREATE POLICY "Finance can manage mpesa transactions" 
ON public.mpesa_transactions 
FOR ALL 
USING (has_role(auth.uid(), 'finance'::app_role));

-- Visitors can view M-Pesa transactions
CREATE POLICY "Visitors can view mpesa transactions" 
ON public.mpesa_transactions 
FOR SELECT 
USING (has_role(auth.uid(), 'visitor'::app_role));

-- Service role can insert/update (for edge functions)
CREATE POLICY "Service can insert mpesa transactions" 
ON public.mpesa_transactions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service can update mpesa transactions" 
ON public.mpesa_transactions 
FOR UPDATE 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_mpesa_transactions_checkout_request_id ON public.mpesa_transactions(checkout_request_id);
CREATE INDEX idx_mpesa_transactions_learner_id ON public.mpesa_transactions(learner_id);
CREATE INDEX idx_mpesa_transactions_account_reference ON public.mpesa_transactions(account_reference);

-- Add trigger for updated_at
CREATE TRIGGER update_mpesa_transactions_updated_at
BEFORE UPDATE ON public.mpesa_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();