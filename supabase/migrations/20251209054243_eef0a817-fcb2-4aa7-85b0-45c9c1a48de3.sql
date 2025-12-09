-- Update RLS policies to allow finance users to access financial tables

-- Fee payments - allow finance role
CREATE POLICY "Finance can manage fee payments" 
ON public.fee_payments 
FOR ALL
USING (has_role(auth.uid(), 'finance'::app_role));

-- Fee structures - allow finance role
CREATE POLICY "Finance can manage fee structures" 
ON public.fee_structures 
FOR ALL
USING (has_role(auth.uid(), 'finance'::app_role));

-- Fee balances - allow finance role
CREATE POLICY "Finance can manage fee balances" 
ON public.fee_balances 
FOR ALL
USING (has_role(auth.uid(), 'finance'::app_role));

-- Fee transactions - allow finance role
CREATE POLICY "Finance can manage fee transactions" 
ON public.fee_transactions 
FOR ALL
USING (has_role(auth.uid(), 'finance'::app_role));

-- Student invoices - allow finance role
CREATE POLICY "Finance can manage student invoices" 
ON public.student_invoices 
FOR ALL
USING (has_role(auth.uid(), 'finance'::app_role));

-- Invoice line items - allow finance role
CREATE POLICY "Finance can manage invoice line items" 
ON public.invoice_line_items 
FOR ALL
USING (has_role(auth.uid(), 'finance'::app_role));

-- Fee structure items - allow finance role
CREATE POLICY "Finance can manage fee structure items" 
ON public.fee_structure_items 
FOR ALL
USING (has_role(auth.uid(), 'finance'::app_role));

-- Fee audit log - allow finance role to view
CREATE POLICY "Finance can view audit log" 
ON public.fee_audit_log 
FOR SELECT
USING (has_role(auth.uid(), 'finance'::app_role));

-- Fee categories - allow finance role
CREATE POLICY "Finance can manage fee categories" 
ON public.fee_categories 
FOR ALL
USING (has_role(auth.uid(), 'finance'::app_role));

-- Discount settings - allow finance role
CREATE POLICY "Finance can manage discount settings" 
ON public.discount_settings 
FOR ALL
USING (has_role(auth.uid(), 'finance'::app_role));

-- Allow finance users to view learners for fee management purposes
CREATE POLICY "Finance can view learners" 
ON public.learners 
FOR SELECT
USING (has_role(auth.uid(), 'finance'::app_role));

-- Allow finance to view grades for fee structures
CREATE POLICY "Finance can view grades" 
ON public.grades 
FOR SELECT
USING (has_role(auth.uid(), 'finance'::app_role));

-- Allow finance to view streams for context
CREATE POLICY "Finance can view streams" 
ON public.streams 
FOR SELECT
USING (has_role(auth.uid(), 'finance'::app_role));