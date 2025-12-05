-- Fix Critical Security Issue: Remove public access to fee_transactions table
-- The "Learners can view their own fee transactions" policy has condition 'true', exposing ALL transaction records

DROP POLICY IF EXISTS "Learners can view their own fee transactions" ON public.fee_transactions;

-- The existing restrictive policies will handle proper access:
-- - "Admins can manage transactions" - full access for admins
-- - "Students can view their own transactions" - properly restricted to user's own transactions
-- - "Parents can view their children's transactions" - restricted to their children only