-- Fix RLS policies for performance_records to allow INSERT with proper WITH CHECK
DROP POLICY IF EXISTS "Admins can manage all performance records" ON public.performance_records;
DROP POLICY IF EXISTS "Teachers can manage performance records" ON public.performance_records;

-- Recreate policies with proper WITH CHECK expressions for INSERT
CREATE POLICY "Admins can manage all performance records"
ON public.performance_records
FOR ALL
TO public
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can manage performance records"
ON public.performance_records
FOR ALL
TO public
USING (has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

COMMENT ON POLICY "Admins can manage all performance records" ON public.performance_records 
IS 'Allows admins to create, read, update, and delete all performance records';

COMMENT ON POLICY "Teachers can manage performance records" ON public.performance_records 
IS 'Allows teachers to create, read, update, and delete performance records';