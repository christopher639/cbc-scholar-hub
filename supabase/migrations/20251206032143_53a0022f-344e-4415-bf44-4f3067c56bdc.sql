-- Add mission, vision, and core_values columns to school_info table
ALTER TABLE public.school_info 
ADD COLUMN IF NOT EXISTS mission text,
ADD COLUMN IF NOT EXISTS vision text,
ADD COLUMN IF NOT EXISTS core_values text;