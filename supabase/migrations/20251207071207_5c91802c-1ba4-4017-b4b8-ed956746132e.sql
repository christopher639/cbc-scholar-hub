
-- Create a function to log activity for any table operation
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_action TEXT;
  v_entity_name TEXT;
  v_entity_id UUID;
  v_details JSONB;
  v_user_id UUID;
  v_user_name TEXT;
  v_user_role TEXT;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
    v_entity_id := NEW.id;
    v_details := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'updated';
    v_entity_id := NEW.id;
    v_details := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
    v_entity_id := OLD.id;
    v_details := to_jsonb(OLD);
  END IF;

  -- Try to get entity name based on table
  v_entity_name := NULL;
  IF TG_TABLE_NAME = 'learners' THEN
    IF TG_OP = 'DELETE' THEN
      v_entity_name := OLD.first_name || ' ' || OLD.last_name;
    ELSE
      v_entity_name := NEW.first_name || ' ' || NEW.last_name;
    END IF;
  ELSIF TG_TABLE_NAME = 'teachers' THEN
    IF TG_OP = 'DELETE' THEN
      v_entity_name := OLD.first_name || ' ' || OLD.last_name;
    ELSE
      v_entity_name := NEW.first_name || ' ' || NEW.last_name;
    END IF;
  ELSIF TG_TABLE_NAME = 'non_teaching_staff' THEN
    IF TG_OP = 'DELETE' THEN
      v_entity_name := OLD.first_name || ' ' || OLD.last_name;
    ELSE
      v_entity_name := NEW.first_name || ' ' || NEW.last_name;
    END IF;
  ELSIF TG_TABLE_NAME = 'parents' THEN
    IF TG_OP = 'DELETE' THEN
      v_entity_name := OLD.first_name || ' ' || OLD.last_name;
    ELSE
      v_entity_name := NEW.first_name || ' ' || NEW.last_name;
    END IF;
  ELSIF TG_TABLE_NAME = 'grades' THEN
    IF TG_OP = 'DELETE' THEN
      v_entity_name := OLD.name;
    ELSE
      v_entity_name := NEW.name;
    END IF;
  ELSIF TG_TABLE_NAME = 'streams' THEN
    IF TG_OP = 'DELETE' THEN
      v_entity_name := OLD.name;
    ELSE
      v_entity_name := NEW.name;
    END IF;
  ELSIF TG_TABLE_NAME = 'learning_areas' THEN
    IF TG_OP = 'DELETE' THEN
      v_entity_name := OLD.name;
    ELSE
      v_entity_name := NEW.name;
    END IF;
  ELSIF TG_TABLE_NAME = 'blogs' THEN
    IF TG_OP = 'DELETE' THEN
      v_entity_name := OLD.title;
    ELSE
      v_entity_name := NEW.title;
    END IF;
  ELSIF TG_TABLE_NAME = 'student_invoices' THEN
    IF TG_OP = 'DELETE' THEN
      v_entity_name := OLD.invoice_number;
    ELSE
      v_entity_name := NEW.invoice_number;
    END IF;
  ELSIF TG_TABLE_NAME = 'fee_transactions' THEN
    IF TG_OP = 'DELETE' THEN
      v_entity_name := OLD.transaction_number;
    ELSE
      v_entity_name := NEW.transaction_number;
    END IF;
  ELSIF TG_TABLE_NAME = 'assignments' THEN
    IF TG_OP = 'DELETE' THEN
      v_entity_name := OLD.title;
    ELSE
      v_entity_name := NEW.title;
    END IF;
  END IF;

  -- Get current user info
  v_user_id := auth.uid();
  
  -- Try to get user name from profiles
  SELECT full_name INTO v_user_name FROM profiles WHERE id = v_user_id;
  
  -- Get user role
  SELECT role::TEXT INTO v_user_role FROM user_roles WHERE user_id = v_user_id LIMIT 1;

  -- Insert activity log
  INSERT INTO activity_logs (
    action,
    entity_type,
    entity_id,
    entity_name,
    user_id,
    user_name,
    user_role,
    details
  ) VALUES (
    v_action,
    TG_TABLE_NAME,
    v_entity_id,
    v_entity_name,
    v_user_id,
    v_user_name,
    v_user_role,
    v_details
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers for all major tables
DROP TRIGGER IF EXISTS log_learners_activity ON learners;
CREATE TRIGGER log_learners_activity
  AFTER INSERT OR UPDATE OR DELETE ON learners
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_teachers_activity ON teachers;
CREATE TRIGGER log_teachers_activity
  AFTER INSERT OR UPDATE OR DELETE ON teachers
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_non_teaching_staff_activity ON non_teaching_staff;
CREATE TRIGGER log_non_teaching_staff_activity
  AFTER INSERT OR UPDATE OR DELETE ON non_teaching_staff
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_parents_activity ON parents;
CREATE TRIGGER log_parents_activity
  AFTER INSERT OR UPDATE OR DELETE ON parents
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_grades_activity ON grades;
CREATE TRIGGER log_grades_activity
  AFTER INSERT OR UPDATE OR DELETE ON grades
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_streams_activity ON streams;
CREATE TRIGGER log_streams_activity
  AFTER INSERT OR UPDATE OR DELETE ON streams
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_learning_areas_activity ON learning_areas;
CREATE TRIGGER log_learning_areas_activity
  AFTER INSERT OR UPDATE OR DELETE ON learning_areas
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_performance_records_activity ON performance_records;
CREATE TRIGGER log_performance_records_activity
  AFTER INSERT OR UPDATE OR DELETE ON performance_records
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_fee_structures_activity ON fee_structures;
CREATE TRIGGER log_fee_structures_activity
  AFTER INSERT OR UPDATE OR DELETE ON fee_structures
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_student_invoices_activity ON student_invoices;
CREATE TRIGGER log_student_invoices_activity
  AFTER INSERT OR UPDATE OR DELETE ON student_invoices
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_fee_transactions_activity ON fee_transactions;
CREATE TRIGGER log_fee_transactions_activity
  AFTER INSERT OR UPDATE OR DELETE ON fee_transactions
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_fee_payments_activity ON fee_payments;
CREATE TRIGGER log_fee_payments_activity
  AFTER INSERT OR UPDATE OR DELETE ON fee_payments
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_blogs_activity ON blogs;
CREATE TRIGGER log_blogs_activity
  AFTER INSERT OR UPDATE OR DELETE ON blogs
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_gallery_images_activity ON gallery_images;
CREATE TRIGGER log_gallery_images_activity
  AFTER INSERT OR UPDATE OR DELETE ON gallery_images
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_assignments_activity ON assignments;
CREATE TRIGGER log_assignments_activity
  AFTER INSERT OR UPDATE OR DELETE ON assignments
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_assignment_submissions_activity ON assignment_submissions;
CREATE TRIGGER log_assignment_submissions_activity
  AFTER INSERT OR UPDATE OR DELETE ON assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_attendance_activity ON attendance;
CREATE TRIGGER log_attendance_activity
  AFTER INSERT OR UPDATE OR DELETE ON attendance
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_academic_years_activity ON academic_years;
CREATE TRIGGER log_academic_years_activity
  AFTER INSERT OR UPDATE OR DELETE ON academic_years
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_academic_periods_activity ON academic_periods;
CREATE TRIGGER log_academic_periods_activity
  AFTER INSERT OR UPDATE OR DELETE ON academic_periods
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_school_info_activity ON school_info;
CREATE TRIGGER log_school_info_activity
  AFTER INSERT OR UPDATE OR DELETE ON school_info
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_notifications_activity ON notifications;
CREATE TRIGGER log_notifications_activity
  AFTER INSERT OR UPDATE OR DELETE ON notifications
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_user_roles_activity ON user_roles;
CREATE TRIGGER log_user_roles_activity
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_alumni_activity ON alumni;
CREATE TRIGGER log_alumni_activity
  AFTER INSERT OR UPDATE OR DELETE ON alumni
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_promotion_history_activity ON promotion_history;
CREATE TRIGGER log_promotion_history_activity
  AFTER INSERT OR UPDATE OR DELETE ON promotion_history
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_transfer_records_activity ON transfer_records;
CREATE TRIGGER log_transfer_records_activity
  AFTER INSERT OR UPDATE OR DELETE ON transfer_records
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_discount_settings_activity ON discount_settings;
CREATE TRIGGER log_discount_settings_activity
  AFTER INSERT OR UPDATE OR DELETE ON discount_settings
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_hero_backgrounds_activity ON hero_backgrounds;
CREATE TRIGGER log_hero_backgrounds_activity
  AFTER INSERT OR UPDATE OR DELETE ON hero_backgrounds
  FOR EACH ROW EXECUTE FUNCTION log_activity();
