-- Function to recalculate and apply discounts to existing invoices
-- This will update invoices that were created before discount settings were enabled
CREATE OR REPLACE FUNCTION public.recalculate_invoice_discounts()
RETURNS TABLE(invoice_id uuid, learner_name text, original_amount numeric, discount_amount numeric, discount_reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice RECORD;
  v_is_staff_child boolean;
  v_sibling_count integer;
  v_staff_discount_pct numeric := 0;
  v_sibling_discount_pct numeric := 0;
  v_staff_enabled boolean := false;
  v_sibling_enabled boolean := false;
  v_calculated_discount numeric := 0;
  v_discount_reason text := '';
  v_fee_structure_amount numeric := 0;
BEGIN
  -- Get discount settings
  SELECT percentage, is_enabled INTO v_staff_discount_pct, v_staff_enabled
  FROM discount_settings
  WHERE discount_type = 'staff_parent'
  LIMIT 1;

  SELECT percentage, is_enabled INTO v_sibling_discount_pct, v_sibling_enabled
  FROM discount_settings
  WHERE discount_type = 'sibling'
  LIMIT 1;

  -- Loop through all non-cancelled invoices without discounts applied
  FOR v_invoice IN 
    SELECT si.id, si.learner_id, si.fee_structure_id, si.total_amount, si.balance_due,
           l.first_name || ' ' || l.last_name AS learner_name,
           l.is_staff_child, l.parent_id,
           fs.amount AS fee_structure_amount
    FROM student_invoices si
    JOIN learners l ON l.id = si.learner_id
    LEFT JOIN fee_structures fs ON fs.id = si.fee_structure_id
    WHERE si.status != 'cancelled'
      AND (si.discount_amount IS NULL OR si.discount_amount = 0)
  LOOP
    v_calculated_discount := 0;
    v_discount_reason := '';
    v_fee_structure_amount := COALESCE(v_invoice.fee_structure_amount, v_invoice.total_amount);

    -- Check staff child discount
    IF v_invoice.is_staff_child AND v_staff_enabled AND v_staff_discount_pct > 0 THEN
      v_calculated_discount := v_fee_structure_amount * (v_staff_discount_pct / 100);
      v_discount_reason := 'Staff Parent Discount (' || v_staff_discount_pct || '%)';
    ELSE
      -- Calculate sibling count
      SELECT COUNT(*) - 1 INTO v_sibling_count
      FROM learners l1
      WHERE l1.parent_id = v_invoice.parent_id
        AND l1.status = 'active'
        AND l1.parent_id IS NOT NULL;

      -- Check sibling discount
      IF v_sibling_count > 0 AND v_sibling_enabled AND v_sibling_discount_pct > 0 THEN
        v_calculated_discount := v_fee_structure_amount * (v_sibling_discount_pct / 100);
        v_discount_reason := 'Sibling Discount (' || v_sibling_discount_pct || '%)';
      END IF;
    END IF;

    -- Update invoice if discount should be applied
    IF v_calculated_discount > 0 THEN
      UPDATE student_invoices
      SET 
        discount_amount = v_calculated_discount,
        discount_reason = v_discount_reason,
        balance_due = balance_due - v_calculated_discount,
        updated_at = now()
      WHERE id = v_invoice.id;

      -- Return the updated invoice info
      invoice_id := v_invoice.id;
      learner_name := v_invoice.learner_name;
      original_amount := v_invoice.total_amount;
      discount_amount := v_calculated_discount;
      discount_reason := v_discount_reason;
      
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;