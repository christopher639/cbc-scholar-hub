-- Create attendance table for tracking learner attendance
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT,
  recorded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(learner_id, date)
);

-- Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Learners can view their own attendance"
ON attendance FOR SELECT
USING (learner_id IN (SELECT id FROM learners));

CREATE POLICY "Admins can manage all attendance"
ON attendance FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can manage attendance"
ON attendance FOR ALL
USING (has_role(auth.uid(), 'teacher'::app_role));

-- Create index for performance
CREATE INDEX idx_attendance_learner_date ON attendance(learner_id, date DESC);

-- Update updated_at trigger
CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON attendance
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();