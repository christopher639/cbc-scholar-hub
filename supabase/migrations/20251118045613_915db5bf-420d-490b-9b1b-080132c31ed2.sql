-- Add ID number field to teachers for authentication
ALTER TABLE teachers ADD COLUMN id_number text UNIQUE;

-- Add is_staff_child field to learners for fee discount
ALTER TABLE learners ADD COLUMN is_staff_child boolean DEFAULT false;

-- Add class_teacher_id to streams
ALTER TABLE streams ADD COLUMN class_teacher_id uuid REFERENCES teachers(id);

-- Create fee categories table
CREATE TABLE fee_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE fee_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fee categories"
  ON fee_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view fee categories"
  ON fee_categories FOR SELECT
  USING (true);

-- Update fee_structures to support categories
ALTER TABLE fee_structures ADD COLUMN category_id uuid REFERENCES fee_categories(id);

-- Create discount settings table
CREATE TABLE discount_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_type text NOT NULL CHECK (discount_type IN ('staff_child', 'multi_child', 'early_payment', 'bursary')),
  percentage numeric NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(discount_type)
);

ALTER TABLE discount_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage discount settings"
  ON discount_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view discount settings"
  ON discount_settings FOR SELECT
  USING (true);

-- Create teacher authentication sessions table
CREATE TABLE teacher_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  last_accessed timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teacher_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their own sessions"
  ON teacher_sessions FOR ALL
  USING (teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_fee_categories_updated_at
  BEFORE UPDATE ON fee_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discount_settings_updated_at
  BEFORE UPDATE ON discount_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default fee categories
INSERT INTO fee_categories (name, description) VALUES
  ('Tuition', 'Main tuition fees'),
  ('Food', 'Meal and cafeteria fees'),
  ('Library', 'Library access and books'),
  ('Sports', 'Sports activities and equipment'),
  ('Transport', 'School bus and transport'),
  ('Exam', 'Examination fees');

-- Insert default discount settings
INSERT INTO discount_settings (discount_type, percentage, is_enabled) VALUES
  ('staff_child', 20, true),
  ('multi_child', 10, false),
  ('early_payment', 5, false),
  ('bursary', 50, false);