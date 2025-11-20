-- Fix search path for generate_learner_invoice function
CREATE OR REPLACE FUNCTION public.generate_learner_invoice(
  p_learner_id uuid, 
  p_grade_id uuid, 
  p_stream_id uuid, 
  p_academic_year text, 
  p_term term
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_invoice_id uuid;
  v_fee_structure_id uuid;
  v_total_amount numeric;
  v_invoice_number text;
  v_due_date date;
  v_existing_invoice uuid;
  v_is_staff_child boolean;
  v_sibling_count integer;
  v_discount_amount numeric := 0;
  v_discount_reason text := '';
  v_staff_discount_pct numeric := 0;
  v_sibling_discount_pct numeric := 0;
  v_staff_enabled boolean := false;
  v_sibling_enabled boolean := false;
BEGIN
  -- Check if invoice already exists for this learner, term and year
  SELECT id INTO v_existing_invoice
  FROM student_invoices
  WHERE learner_id = p_learner_id
    AND academic_year = p_academic_year
    AND term = p_term
    AND status != 'cancelled';
  
  IF v_existing_invoice IS NOT NULL THEN
    RETURN v_existing_invoice;
  END IF;

  -- Get fee structure for the grade and term
  SELECT id, amount INTO v_fee_structure_id, v_total_amount
  FROM fee_structures
  WHERE grade_id = p_grade_id
    AND academic_year = p_academic_year
    AND term = p_term
  LIMIT 1;

  IF v_fee_structure_id IS NULL THEN
    RAISE EXCEPTION 'No fee structure found for grade % in academic year % term %', 
      p_grade_id, p_academic_year, p_term;
  END IF;

  -- Get learner info for discount calculation
  SELECT is_staff_child INTO v_is_staff_child
  FROM learners
  WHERE id = p_learner_id;

  -- Get discount settings
  SELECT percentage, is_enabled INTO v_staff_discount_pct, v_staff_enabled
  FROM discount_settings
  WHERE discount_type = 'staff_parent'
  LIMIT 1;

  SELECT percentage, is_enabled INTO v_sibling_discount_pct, v_sibling_enabled
  FROM discount_settings
  WHERE discount_type = 'sibling'
  LIMIT 1;

  -- Calculate sibling count (how many active learners with same parent)
  SELECT COUNT(*) - 1 INTO v_sibling_count
  FROM learners l1
  WHERE l1.parent_id = (SELECT parent_id FROM learners WHERE id = p_learner_id)
    AND l1.status = 'active'
    AND l1.parent_id IS NOT NULL;

  -- Apply staff discount if eligible
  IF v_is_staff_child AND v_staff_enabled AND v_staff_discount_pct > 0 THEN
    v_discount_amount := v_total_amount * (v_staff_discount_pct / 100);
    v_discount_reason := 'Staff Parent Discount (' || v_staff_discount_pct || '%)';
  END IF;

  -- Apply sibling discount if eligible (2nd child onwards)
  IF v_sibling_count > 0 AND v_sibling_enabled AND v_sibling_discount_pct > 0 AND v_discount_amount = 0 THEN
    v_discount_amount := v_total_amount * (v_sibling_discount_pct / 100);
    v_discount_reason := 'Sibling Discount (' || v_sibling_discount_pct || '%)';
  END IF;

  -- Generate invoice number
  v_invoice_number := generate_invoice_number();
  
  -- Set due date (30 days from issue date)
  v_due_date := CURRENT_DATE + INTERVAL '30 days';

  -- Create invoice with discount applied
  INSERT INTO student_invoices (
    learner_id,
    grade_id,
    stream_id,
    fee_structure_id,
    academic_year,
    term,
    invoice_number,
    issue_date,
    due_date,
    total_amount,
    discount_amount,
    discount_reason,
    amount_paid,
    balance_due,
    status,
    generated_by
  ) VALUES (
    p_learner_id,
    p_grade_id,
    p_stream_id,
    v_fee_structure_id,
    p_academic_year,
    p_term,
    v_invoice_number,
    CURRENT_DATE,
    v_due_date,
    v_total_amount,
    v_discount_amount,
    v_discount_reason,
    0,
    v_total_amount - v_discount_amount,
    'generated',
    auth.uid()
  )
  RETURNING id INTO v_invoice_id;

  -- Copy fee structure items to invoice line items
  INSERT INTO invoice_line_items (
    invoice_id,
    item_name,
    description,
    amount,
    is_optional,
    display_order
  )
  SELECT 
    v_invoice_id,
    item_name,
    description,
    amount,
    is_optional,
    display_order
  FROM fee_structure_items
  WHERE fee_structure_id = v_fee_structure_id
  ORDER BY display_order;

  -- Log the action
  INSERT INTO fee_audit_log (
    action_type,
    entity_type,
    entity_id,
    learner_id,
    performed_by,
    new_values
  ) VALUES (
    'invoice_generated',
    'invoice',
    v_invoice_id,
    p_learner_id,
    auth.uid(),
    jsonb_build_object(
      'invoice_number', v_invoice_number,
      'total_amount', v_total_amount,
      'discount_amount', v_discount_amount,
      'discount_reason', v_discount_reason,
      'academic_year', p_academic_year,
      'term', p_term
    )
  );

  RETURN v_invoice_id;
END;
$function$;