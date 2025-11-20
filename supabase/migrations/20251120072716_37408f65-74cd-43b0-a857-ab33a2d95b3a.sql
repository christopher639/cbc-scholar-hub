-- Fix fee_audit_log action_type constraint to allow invoice generation
ALTER TABLE fee_audit_log DROP CONSTRAINT IF EXISTS fee_audit_log_action_type_check;

-- Add correct constraint that allows invoice-related actions
ALTER TABLE fee_audit_log ADD CONSTRAINT fee_audit_log_action_type_check 
CHECK (action_type IN ('created', 'updated', 'deleted', 'payment_recorded', 'invoice_generated', 'invoice_cancelled'));

-- Update the generate_learner_invoice function to use correct action_type
CREATE OR REPLACE FUNCTION generate_learner_invoice(
  p_learner_id uuid,
  p_grade_id uuid,
  p_stream_id uuid,
  p_academic_year text,
  p_term term
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice_id uuid;
  v_fee_structure_id uuid;
  v_total_amount numeric;
  v_invoice_number text;
  v_due_date date;
  v_existing_invoice uuid;
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

  -- Generate invoice number
  v_invoice_number := generate_invoice_number();
  
  -- Set due date (30 days from issue date)
  v_due_date := CURRENT_DATE + INTERVAL '30 days';

  -- Create invoice
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
    0,
    v_total_amount,
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

  -- Log the action with correct action_type
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
      'academic_year', p_academic_year,
      'term', p_term
    )
  );

  RETURN v_invoice_id;
END;
$$;