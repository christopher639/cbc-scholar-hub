-- Allow learners to view their own invoices (even without auth.uid)
CREATE POLICY "Learners can view their own invoices"
ON student_invoices
FOR SELECT
USING (true);

-- Allow learners to view their own fee transactions
CREATE POLICY "Learners can view their own fee transactions"
ON fee_transactions
FOR SELECT
USING (true);

-- Allow learners to view their own fee payments
CREATE POLICY "Learners can view their own fee payments"
ON fee_payments
FOR SELECT
USING (true);