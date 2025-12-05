-- Fix Critical Security Issue: Remove public access to fee_payments table
-- The "Learners can view their own fee payments" policy has condition 'true', exposing ALL payment records

DROP POLICY IF EXISTS "Learners can view their own fee payments" ON public.fee_payments;

-- The existing restrictive policies will handle proper access:
-- - "Admins can manage fee payments" - full access for admins
-- - "Students can view their own fee payments" - properly restricted to user's own payments
-- - "Parents can view their children's fee payments" - restricted to their children only