-- ============================================
-- STUDENT CANCELLATIONS SCHEMA & RPC
-- Execute this in Supabase SQL Editor
-- ============================================

-- 1. Add cancellation_reason to appointments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'cancellation_reason') THEN
    ALTER TABLE appointments ADD COLUMN cancellation_reason TEXT;
  END IF;
END $$;

-- 2. Create the RPC function to handle student cancellations safely
CREATE OR REPLACE FUNCTION cancel_appointment_student(
  p_appointment_id UUID,
  p_reason TEXT,
  p_student_token UUID -- Access token or direct user id
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment RECORD;
  v_hours_difference DECIMAL;
  v_tutor_id UUID;
  v_student_name TEXT;
  v_start_timestamp TIMESTAMPTZ;
BEGIN
  -- 1. Get the appointment details
  SELECT id, user_id, date, start_time, status, student_name, student_id, student_email
  INTO v_appointment
  FROM appointments
  WHERE id = p_appointment_id;

  IF v_appointment.id IS NULL THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  IF v_appointment.status = 'cancelled' THEN
     RAISE EXCEPTION 'Appointment is already cancelled';
  END IF;

  -- 2. Construct full timestamp of the appointment
  v_start_timestamp := (v_appointment.date || ' ' || v_appointment.start_time)::TIMESTAMPTZ;

  -- 3. Calculate hours difference between now and appointment time
  v_hours_difference := EXTRACT(EPOCH FROM (v_start_timestamp - NOW())) / 3600;

  -- 4. Validate the 24-hour rule
  IF v_hours_difference < 24 THEN
    RAISE EXCEPTION 'Cannot cancel appointment less than 24 hours before it starts. Please contact your tutor directly.';
  END IF;

  -- 5. Update appointment status and reason
  UPDATE appointments
  SET 
    status = 'cancelled',
    payment_status = CASE 
      WHEN payment_status = 'paid' THEN 'refunded' 
      ELSE payment_status 
    END,
    cancellation_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_appointment_id
  RETURNING user_id, student_name INTO v_tutor_id, v_student_name;

  -- 5.5. Update related payments to refunded
  UPDATE payments
  SET 
    status = 'refunded',
    updated_at = NOW()
  WHERE appointment_id = p_appointment_id AND status = 'completed';

  -- 6. Generate notification for the tutor
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    v_tutor_id,
    'booking_cancel',
    'Cita cancelada por el alumno',
    'El alumno ' || v_student_name || ' ha cancelado su cita del ' || v_appointment.date || '. Motivo: ' || p_reason,
    jsonb_build_object(
      'appointment_id', p_appointment_id,
      'date', v_appointment.date,
      'reason', p_reason
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Appointment cancelled successfully'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION cancel_appointment_student(UUID, TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION cancel_appointment_student(UUID, TEXT, UUID) TO authenticated;
