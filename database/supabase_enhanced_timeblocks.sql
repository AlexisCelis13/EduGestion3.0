-- ============================================
-- ENHANCED TIME BLOCKS - Multi-day Support
-- Execute this in Supabase SQL Editor
-- ============================================

-- Add days_of_week array column (stores multiple days like [1,3,5] for Mon,Wed,Fri)
ALTER TABLE date_overrides 
ADD COLUMN IF NOT EXISTS days_of_week INTEGER[];

-- Add end_date for temporary recurring blocks
ALTER TABLE date_overrides 
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Migrate existing single day_of_week to new array format
UPDATE date_overrides 
SET days_of_week = ARRAY[day_of_week]
WHERE day_of_week IS NOT NULL AND days_of_week IS NULL;
