-- ============================================
-- PUBLIC BOOKING SECURITY & FUNCTIONS
-- Execute this in Supabase SQL Editor
-- ============================================

-- 1. Enable Public Inserts on Appointments
-- This allows anyone (even not logged in) to create an appointment
-- We restrict what they can set in the Check (e.g. they can't set status to 'confirmed' directly if we wanted strict control, but for MVP 'pending' is default)
DROP POLICY IF EXISTS "Public can insert appointments" ON appointments;

-- Fix: Make student_id nullable to allow guest bookings
ALTER TABLE appointments ALTER COLUMN student_id DROP NOT NULL;

-- Fix: Make service_id nullable to allow 'General Consultation'
ALTER TABLE appointments ALTER COLUMN service_id DROP NOT NULL;

CREATE POLICY "Public can insert appointments" ON appointments
  FOR INSERT WITH CHECK (true);

-- 2. Secure Availability Check (RPC)
-- Instead of giving public read access to the appointments table (which reveals student names/emails),
-- we create a function that ONLY returns the start/end times of busy slots.

CREATE OR REPLACE FUNCTION get_busy_slots(p_tutor_id UUID, p_date DATE)
RETURNS TABLE (start_time TIME, end_time TIME)
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with admin privileges to read appointments
AS $$
BEGIN
  RETURN QUERY
  SELECT a.start_time, a.end_time
  FROM appointments a
  WHERE a.user_id = p_tutor_id
    AND a.date = p_date
    AND a.status != 'cancelled';
END;
$$;

-- Grant execute permission to anon (public) users
GRANT EXECUTE ON FUNCTION get_busy_slots(UUID, DATE) TO anon;
GRANT EXECUTE ON FUNCTION get_busy_slots(UUID, DATE) TO authenticated;
