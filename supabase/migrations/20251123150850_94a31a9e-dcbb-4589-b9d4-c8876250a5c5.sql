-- Add unique constraint to performance_records to support upsert operations
-- This ensures one performance record per learner, learning area, term, and exam type
ALTER TABLE public.performance_records 
ADD CONSTRAINT performance_records_unique_entry 
UNIQUE (learner_id, learning_area_id, academic_year, term, exam_type);

-- Ensure teachers cannot view financial data
-- Remove any existing policies that might allow teacher access to financial tables

-- Fee transactions - only admins
DROP POLICY IF EXISTS "Teachers can view fee transactions" ON public.fee_transactions;

-- Fee payments - only admins
DROP POLICY IF EXISTS "Teachers can view fee payments" ON public.fee_payments;

-- Student invoices - only admins
DROP POLICY IF EXISTS "Teachers can view invoices" ON public.student_invoices;

-- Fee balances - only admins
DROP POLICY IF EXISTS "Teachers can view fee balances" ON public.fee_balances;

-- Fee structures - teachers can view (needed for academic planning)
-- But keep it read-only

COMMENT ON CONSTRAINT performance_records_unique_entry ON public.performance_records 
IS 'Ensures one performance record per learner, learning area, academic year, term, and exam type. Supports upsert operations.';