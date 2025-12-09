-- Add SELECT policies for visitor role on key tables
CREATE POLICY "Visitors can view learners" ON public.learners
FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));

CREATE POLICY "Visitors can view teachers" ON public.teachers
FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));

CREATE POLICY "Visitors can view grades" ON public.grades
FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));

CREATE POLICY "Visitors can view streams" ON public.streams
FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));

CREATE POLICY "Visitors can view fee structures" ON public.fee_structures
FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));

CREATE POLICY "Visitors can view student invoices" ON public.student_invoices
FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));

CREATE POLICY "Visitors can view fee payments" ON public.fee_payments
FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));

CREATE POLICY "Visitors can view fee transactions" ON public.fee_transactions
FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));

CREATE POLICY "Visitors can view performance records" ON public.performance_records
FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));

CREATE POLICY "Visitors can view learning areas" ON public.learning_areas
FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));

CREATE POLICY "Visitors can view academic periods" ON public.academic_periods
FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));

CREATE POLICY "Visitors can view academic years" ON public.academic_years
FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));

CREATE POLICY "Visitors can view non-teaching staff" ON public.non_teaching_staff
FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));

CREATE POLICY "Visitors can view fee balances" ON public.fee_balances
FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));

CREATE POLICY "Visitors can view alumni" ON public.alumni
FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));

CREATE POLICY "Visitors can view assignments" ON public.assignments
FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));

CREATE POLICY "Visitors can view activity logs" ON public.activity_logs
FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));

CREATE POLICY "Visitors can view own notifications" ON public.notifications
FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role) AND user_id = auth.uid());

CREATE POLICY "Visitors can view profiles" ON public.profiles
FOR SELECT USING (has_role(auth.uid(), 'visitor'::app_role));