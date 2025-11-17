-- Add director information fields to school_info table
ALTER TABLE school_info 
ADD COLUMN IF NOT EXISTS director_name TEXT,
ADD COLUMN IF NOT EXISTS director_email TEXT,
ADD COLUMN IF NOT EXISTS director_phone TEXT,
ADD COLUMN IF NOT EXISTS director_photo_url TEXT,
ADD COLUMN IF NOT EXISTS director_qualification TEXT,
ADD COLUMN IF NOT EXISTS director_message TEXT;