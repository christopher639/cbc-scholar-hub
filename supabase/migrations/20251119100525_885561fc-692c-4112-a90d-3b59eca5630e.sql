-- Add academic_year column to performance_records
ALTER TABLE performance_records ADD COLUMN academic_year TEXT;

-- Make academic_period_id nullable (for backward compatibility)
ALTER TABLE performance_records ALTER COLUMN academic_period_id DROP NOT NULL;