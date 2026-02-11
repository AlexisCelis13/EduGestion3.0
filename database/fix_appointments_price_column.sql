-- Fix missing price column in appointments table
-- Execute this in Supabase SQL Editor

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;

-- Ensure payment fields exist as well (just in case)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0;

-- Verify/Fix student_id relationship if needed (optional context)
-- In case appointments.student_id helps tracking non-auth students
-- ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_student_id_fkey;
-- ALTER TABLE appointments ADD CONSTRAINT appointments_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
