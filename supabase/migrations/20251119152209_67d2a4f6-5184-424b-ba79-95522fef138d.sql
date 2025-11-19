-- Function to automatically generate invoice for a learner
CREATE OR REPLACE FUNCTION generate_learner_invoice(
  p_learner_id UUID,
  p_grade_id UUID,
  p_stream_id UUID,
  p_academic_year TEXT,
  p_term term
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice_id UUID;
  v_fee_structure_id UUID;
  v_total_amount NUMERIC := 0;
  v_invoice_number TEXT;
  v_discount_amount NUMERIC := 0;
  v_discount_percentage NUMERIC := 0;
  v_is_staff_child BOOLEAN;
BEGIN
  -- Check if invoice already exists for this learner, grade, year, and term
  SELECT id INTO v_invoice_id
  FROM student_invoices
  WHERE learner_id = p_learner_id
    AND grade_id = p_grade_id
    AND academic_year = p_academic_year
    AND term = p_term
    AND status != 'cancelled';
  
  IF v_invoice_id IS NOT NULL THEN
    RETURN v_invoice_id; -- Invoice already exists
  END IF;
  
  -- Get the fee structure for this grade, year, and term
  SELECT id INTO v_fee_structure_id
  FROM fee_structures
  WHERE grade_id = p_grade_id
    AND academic_year = p_academic_year
    AND term = p_term
  LIMIT 1;
  
  IF v_fee_structure_id IS NULL THEN
    RAISE EXCEPTION 'No fee structure found for grade %, year %, term %', p_grade_id, p_academic_year, p_term;
  END IF;
  
  -- Calculate total from mandatory fee structure items
  SELECT COALESCE(SUM(amount), 0) INTO v_total_amount
  FROM fee_structure_items
  WHERE fee_structure_id = v_fee_structure_id
    AND is_optional = false;
  
  -- Check if learner is staff child for discount
  SELECT is_staff_child INTO v_is_staff_child
  FROM learners
  WHERE id = p_learner_id;
  
  -- Apply staff child discount if enabled
  IF v_is_staff_child THEN
    SELECT percentage INTO v_discount_percentage
    FROM discount_settings
    WHERE discount_type = 'staff_child'
      AND is_enabled = true
    LIMIT 1;
    
    IF v_discount_percentage > 0 THEN
      v_discount_amount := v_total_amount * (v_discount_percentage / 100);
    END IF;
  END IF;
  
  -- Generate invoice number
  v_invoice_number := generate_invoice_number();
  
  -- Create the invoice
  INSERT INTO student_invoices (
    invoice_number,
    learner_id,
    grade_id,
    stream_id,
    academic_year,
    term,
    fee_structure_id,
    total_amount,
    discount_amount,
    balance_due,
    amount_paid,
    issue_date,
    due_date,
    status,
    discount_reason
  ) VALUES (
    v_invoice_number,
    p_learner_id,
    p_grade_id,
    p_stream_id,
    p_academic_year,
    p_term,
    v_fee_structure_id,
    v_total_amount,
    v_discount_amount,
    v_total_amount - v_discount_amount,
    0,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'generated',
    CASE WHEN v_is_staff_child AND v_discount_amount > 0 THEN 'Staff child discount' ELSE NULL END
  ) RETURNING id INTO v_invoice_id;
  
  -- Copy fee structure items to invoice line items
  INSERT INTO invoice_line_items (
    invoice_id,
    item_name,
    amount,
    is_optional,
    description,
    display_order
  )
  SELECT
    v_invoice_id,
    item_name,
    amount,
    is_optional,
    description,
    display_order
  FROM fee_structure_items
  WHERE fee_structure_id = v_fee_structure_id
    AND is_optional = false;
  
  -- Log the invoice generation
  INSERT INTO fee_audit_log (
    entity_type,
    entity_id,
    action_type,
    performed_by,
    learner_id,
    new_values
  ) VALUES (
    'invoice',
    v_invoice_id,
    'created',
    auth.uid(),
    p_learner_id,
    jsonb_build_object(
      'invoice_number', v_invoice_number,
      'total_amount', v_total_amount,
      'discount_amount', v_discount_amount,
      'academic_year', p_academic_year,
      'term', p_term
    )
  );
  
  RETURN v_invoice_id;
END;
$$;

-- Function to automatically generate invoices on learner enrollment
CREATE OR REPLACE FUNCTION auto_generate_invoice_on_enrollment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_period RECORD;
BEGIN
  -- Only generate invoice for active learners with grade and stream assigned
  IF NEW.status = 'active' AND NEW.current_grade_id IS NOT NULL AND NEW.current_stream_id IS NOT NULL THEN
    -- Get current academic period
    SELECT academic_year, term
    INTO v_current_period
    FROM academic_periods
    WHERE is_current = true
    LIMIT 1;
    
    IF v_current_period IS NOT NULL THEN
      -- Generate invoice for the current period
      PERFORM generate_learner_invoice(
        NEW.id,
        NEW.current_grade_id,
        NEW.current_stream_id,
        v_current_period.academic_year,
        v_current_period.term
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for new learner enrollment
DROP TRIGGER IF EXISTS trigger_auto_invoice_on_enrollment ON learners;
CREATE TRIGGER trigger_auto_invoice_on_enrollment
AFTER INSERT ON learners
FOR EACH ROW
EXECUTE FUNCTION auto_generate_invoice_on_enrollment();

-- Function to generate invoices on grade/stream update (promotion)
CREATE OR REPLACE FUNCTION auto_generate_invoice_on_promotion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_period RECORD;
BEGIN
  -- Check if grade or stream changed and learner is active
  IF NEW.status = 'active' AND 
     (OLD.current_grade_id IS DISTINCT FROM NEW.current_grade_id OR 
      OLD.current_stream_id IS DISTINCT FROM NEW.current_stream_id) AND
     NEW.current_grade_id IS NOT NULL AND 
     NEW.current_stream_id IS NOT NULL THEN
    
    -- Get current academic period
    SELECT academic_year, term
    INTO v_current_period
    FROM academic_periods
    WHERE is_current = true
    LIMIT 1;
    
    IF v_current_period IS NOT NULL THEN
      -- Generate invoice for the new grade/stream
      PERFORM generate_learner_invoice(
        NEW.id,
        NEW.current_grade_id,
        NEW.current_stream_id,
        v_current_period.academic_year,
        v_current_period.term
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for learner promotion
DROP TRIGGER IF EXISTS trigger_auto_invoice_on_promotion ON learners;
CREATE TRIGGER trigger_auto_invoice_on_promotion
AFTER UPDATE ON learners
FOR EACH ROW
EXECUTE FUNCTION auto_generate_invoice_on_promotion();

-- Function to bulk generate invoices for new term
CREATE OR REPLACE FUNCTION bulk_generate_term_invoices(
  p_academic_year TEXT,
  p_term term,
  p_grade_id UUID DEFAULT NULL
) RETURNS TABLE(
  learner_id UUID,
  invoice_id UUID,
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id AS learner_id,
    generate_learner_invoice(
      l.id,
      l.current_grade_id,
      l.current_stream_id,
      p_academic_year,
      p_term
    ) AS invoice_id,
    true AS success,
    NULL::TEXT AS error_message
  FROM learners l
  WHERE l.status = 'active'
    AND l.current_grade_id IS NOT NULL
    AND l.current_stream_id IS NOT NULL
    AND (p_grade_id IS NULL OR l.current_grade_id = p_grade_id)
    AND NOT EXISTS (
      SELECT 1 FROM student_invoices si
      WHERE si.learner_id = l.id
        AND si.academic_year = p_academic_year
        AND si.term = p_term
        AND si.status != 'cancelled'
    );
END;
$$;