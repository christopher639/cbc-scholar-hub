-- Drop existing INSERT policy that requires Supabase Auth
DROP POLICY IF EXISTS "Teachers and admins can insert performance records" ON public.performance_records;

-- Create new INSERT policy that allows:
-- 1. Admins via Supabase Auth
-- 2. Anyone inserting with a valid teacher_id (for custom teacher auth)
CREATE POLICY "Teachers and admins can insert performance records" 
ON public.performance_records 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (
    teacher_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.teachers WHERE id = teacher_id
    )
  )
);

-- Also update the UPDATE policy to allow teachers to update their own records
DROP POLICY IF EXISTS "Admins and teachers can update performance records" ON public.performance_records;

CREATE POLICY "Admins and teachers can update performance records" 
ON public.performance_records 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'teacher'::app_role)
  OR (
    teacher_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.teachers WHERE id = teacher_id
    )
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'teacher'::app_role)
  OR (
    teacher_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.teachers WHERE id = teacher_id
    )
  )
);