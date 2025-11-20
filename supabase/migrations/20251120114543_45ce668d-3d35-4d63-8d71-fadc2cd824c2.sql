-- Fix discount_settings check constraint to match actual usage
ALTER TABLE discount_settings 
DROP CONSTRAINT IF EXISTS discount_settings_discount_type_check;

ALTER TABLE discount_settings
ADD CONSTRAINT discount_settings_discount_type_check 
CHECK (discount_type IN ('staff_parent', 'sibling', 'early_payment', 'early_payment_days', 'bursary'));