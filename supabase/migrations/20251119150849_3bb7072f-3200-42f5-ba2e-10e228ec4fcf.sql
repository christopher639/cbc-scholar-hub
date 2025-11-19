-- =====================================================
-- COMPREHENSIVE FEES MANAGEMENT SYSTEM
-- =====================================================

-- 1. Fee Structure Items (Line Items for Fee Structures)
CREATE TABLE IF NOT EXISTS public.fee_structure_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  is_optional BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Student Invoices (The "Bill")
CREATE TABLE IF NOT EXISTS public.student_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id),
  academic_year TEXT NOT NULL,
  term term NOT NULL,
  grade_id UUID NOT NULL REFERENCES public.grades(id),
  stream_id UUID REFERENCES public.streams(id),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'partial', 'paid', 'overdue', 'cancelled')),
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  discount_reason TEXT,
  notes TEXT,
  generated_by UUID REFERENCES auth.users(id),
  cancelled_by UUID REFERENCES auth.users(id),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Invoice Line Items (Snapshot of fee items at invoice time)
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.student_invoices(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  is_optional BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Fee Transactions (Payment Records)
CREATE TABLE IF NOT EXISTS public.fee_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number TEXT NOT NULL UNIQUE,
  invoice_id UUID NOT NULL REFERENCES public.student_invoices(id) ON DELETE RESTRICT,
  learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE RESTRICT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'mobile_money', 'cheque', 'card', 'other')),
  reference_number TEXT,
  amount_paid NUMERIC(10,2) NOT NULL CHECK (amount_paid > 0),
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT,
  receipt_issued BOOLEAN DEFAULT false,
  receipt_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Fee Audit Log (Complete audit trail)
CREATE TABLE IF NOT EXISTS public.fee_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL CHECK (action_type IN ('invoice_generated', 'invoice_cancelled', 'payment_recorded', 'payment_refunded', 'discount_applied', 'invoice_adjusted', 'fee_structure_created', 'fee_structure_updated')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('invoice', 'transaction', 'fee_structure', 'fee_structure_item')),
  entity_id UUID NOT NULL,
  learner_id UUID REFERENCES public.learners(id),
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_fee_structure_items_structure ON public.fee_structure_items(fee_structure_id);
CREATE INDEX idx_student_invoices_learner ON public.student_invoices(learner_id);
CREATE INDEX idx_student_invoices_status ON public.student_invoices(status);
CREATE INDEX idx_student_invoices_academic ON public.student_invoices(academic_year, term, grade_id);
CREATE INDEX idx_invoice_line_items_invoice ON public.invoice_line_items(invoice_id);
CREATE INDEX idx_fee_transactions_invoice ON public.fee_transactions(invoice_id);
CREATE INDEX idx_fee_transactions_learner ON public.fee_transactions(learner_id);
CREATE INDEX idx_fee_audit_log_entity ON public.fee_audit_log(entity_type, entity_id);
CREATE INDEX idx_fee_audit_log_learner ON public.fee_audit_log(learner_id);

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year TEXT;
  next_number INT;
  new_invoice_number TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 9) AS INTEGER)), 0) + 1
  INTO next_number
  FROM student_invoices
  WHERE invoice_number LIKE 'INV-' || current_year || '%';
  
  new_invoice_number := 'INV-' || current_year || '-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN new_invoice_number;
END;
$$;

-- Function to generate transaction number
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year TEXT;
  next_number INT;
  new_transaction_number TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(transaction_number FROM 9) AS INTEGER)), 0) + 1
  INTO next_number
  FROM fee_transactions
  WHERE transaction_number LIKE 'TXN-' || current_year || '%';
  
  new_transaction_number := 'TXN-' || current_year || '-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN new_transaction_number;
END;
$$;

-- Function to update invoice balance
CREATE OR REPLACE FUNCTION update_invoice_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE student_invoices
  SET 
    amount_paid = (
      SELECT COALESCE(SUM(amount_paid), 0)
      FROM fee_transactions
      WHERE invoice_id = NEW.invoice_id
    ),
    balance_due = total_amount - (
      SELECT COALESCE(SUM(amount_paid), 0)
      FROM fee_transactions
      WHERE invoice_id = NEW.invoice_id
    ),
    status = CASE
      WHEN total_amount <= (
        SELECT COALESCE(SUM(amount_paid), 0)
        FROM fee_transactions
        WHERE invoice_id = NEW.invoice_id
      ) THEN 'paid'
      WHEN (
        SELECT COALESCE(SUM(amount_paid), 0)
        FROM fee_transactions
        WHERE invoice_id = NEW.invoice_id
      ) > 0 THEN 'partial'
      WHEN due_date < CURRENT_DATE THEN 'overdue'
      ELSE 'generated'
    END,
    updated_at = now()
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to update invoice balance after transaction
CREATE TRIGGER update_invoice_balance_trigger
AFTER INSERT ON fee_transactions
FOR EACH ROW
EXECUTE FUNCTION update_invoice_balance();

-- Trigger to set updated_at
CREATE TRIGGER set_updated_at_fee_structure_items
BEFORE UPDATE ON fee_structure_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_student_invoices
BEFORE UPDATE ON student_invoices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_fee_transactions
BEFORE UPDATE ON fee_transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.fee_structure_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fee_structure_items
CREATE POLICY "Admins can manage fee structure items"
ON public.fee_structure_items FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view fee structure items"
ON public.fee_structure_items FOR SELECT
USING (true);

-- RLS Policies for student_invoices
CREATE POLICY "Admins can manage invoices"
ON public.student_invoices FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view their own invoices"
ON public.student_invoices FOR SELECT
USING (learner_id IN (SELECT id FROM learners WHERE user_id = auth.uid()));

CREATE POLICY "Parents can view their children's invoices"
ON public.student_invoices FOR SELECT
USING (learner_id IN (
  SELECT l.id FROM learners l
  WHERE l.parent_id IN (SELECT p.id FROM parents p WHERE p.user_id = auth.uid())
));

-- RLS Policies for invoice_line_items
CREATE POLICY "Admins can manage invoice line items"
ON public.invoice_line_items FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view invoice line items"
ON public.invoice_line_items FOR SELECT
USING (true);

-- RLS Policies for fee_transactions
CREATE POLICY "Admins can manage transactions"
ON public.fee_transactions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view their own transactions"
ON public.fee_transactions FOR SELECT
USING (learner_id IN (SELECT id FROM learners WHERE user_id = auth.uid()));

CREATE POLICY "Parents can view their children's transactions"
ON public.fee_transactions FOR SELECT
USING (learner_id IN (
  SELECT l.id FROM learners l
  WHERE l.parent_id IN (SELECT p.id FROM parents p WHERE p.user_id = auth.uid())
));

-- RLS Policies for fee_audit_log
CREATE POLICY "Admins can view audit log"
ON public.fee_audit_log FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert audit log"
ON public.fee_audit_log FOR INSERT
WITH CHECK (true);