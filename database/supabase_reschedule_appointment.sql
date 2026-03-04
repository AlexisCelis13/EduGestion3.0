-- ============================================
-- STUDENT RESCHEDULE APPOINTMENT RPC
-- Execute this in Supabase SQL Editor
-- ============================================

-- Function to allow students to reschedule their own appointments
-- Validates: appointment ownership, 24h rule, no conflicts on new slot
CREATE OR REPLACE FUNCTION reschedule_appointment_student(
  p_appointment_id UUID,
  p_new_date DATE,
  p_new_start_time TIME,
  p_new_end_time TIME,
  p_student_token UUID -- Access token to validate student identity
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment RECORD;
  v_start_timestamp TIMESTAMPTZ;
  v_hours_difference DECIMAL;
  v_conflict_count INT;
  v_tutor_id UUID;
  v_student_name TEXT;
  v_old_date DATE;
  v_old_start TEXT;
BEGIN
  -- 1. Get the appointment details
  SELECT a.id, a.user_id, a.date, a.start_time, a.end_time, a.status, 
         a.student_name, a.student_id, a.student_email, a.duration_minutes,
         a.service_id, a.modality, a.meeting_link, a.location, a.notes,
         a.payment_status, a.amount_paid
  INTO v_appointment
  FROM appointments a
  WHERE a.id = p_appointment_id;

  IF v_appointment.id IS NULL THEN
    RAISE EXCEPTION 'Cita no encontrada';
  END IF;

  IF v_appointment.status = 'cancelled' THEN
    RAISE EXCEPTION 'No se puede reagendar una cita cancelada';
  END IF;

  -- 2. Verify student ownership via access token
  IF v_appointment.student_id IS NOT NULL THEN
    -- Check that the token belongs to the student who owns this appointment
    IF NOT EXISTS (
      SELECT 1 FROM students 
      WHERE id = v_appointment.student_id 
      AND access_token = p_student_token
    ) THEN
      RAISE EXCEPTION 'No tienes permiso para reagendar esta cita';
    END IF;
  END IF;

  -- 3. Check 24-hour rule on the ORIGINAL appointment
  v_start_timestamp := (v_appointment.date || ' ' || v_appointment.start_time)::TIMESTAMPTZ;
  v_hours_difference := EXTRACT(EPOCH FROM (v_start_timestamp - NOW())) / 3600;

  IF v_hours_difference < 24 THEN
    RAISE EXCEPTION 'Solo puedes reagendar con al menos 24 horas de anticipación';
  END IF;

  -- 4. Check for conflicts on the NEW date/time (same tutor, exclude current appointment)
  SELECT COUNT(*) INTO v_conflict_count
  FROM appointments
  WHERE user_id = v_appointment.user_id
    AND date = p_new_date
    AND id != p_appointment_id
    AND status NOT IN ('cancelled')
    AND (
      (start_time < p_new_end_time AND end_time > p_new_start_time)
    );

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'El horario seleccionado ya está ocupado. Por favor elige otro.';
  END IF;

  -- 5. Save old values for the notification
  v_old_date := v_appointment.date;
  v_old_start := v_appointment.start_time::TEXT;
  v_tutor_id := v_appointment.user_id;
  v_student_name := v_appointment.student_name;

  -- 6. Update the appointment with the new date/time
  UPDATE appointments
  SET 
    date = p_new_date,
    start_time = p_new_start_time,
    end_time = p_new_end_time,
    status = 'scheduled',
    updated_at = NOW()
  WHERE id = p_appointment_id;

  -- 7. Notify the tutor
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    v_tutor_id,
    'booking_new',
    'Cita reagendada por alumno',
    'El alumno ' || COALESCE(v_student_name, 'Sin nombre') || 
      ' reagendó su cita del ' || v_old_date || ' ' || v_old_start || 
      ' al ' || p_new_date || ' ' || p_new_start_time || '.',
    jsonb_build_object(
      'appointment_id', p_appointment_id,
      'old_date', v_old_date,
      'old_start_time', v_old_start,
      'new_date', p_new_date,
      'new_start_time', p_new_start_time,
      'new_end_time', p_new_end_time,
      'student_name', v_student_name
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Cita reagendada exitosamente',
    'new_date', p_new_date,
    'new_start_time', p_new_start_time,
    'new_end_time', p_new_end_time
  );
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION reschedule_appointment_student(UUID, DATE, TIME, TIME, UUID) TO anon;
GRANT EXECUTE ON FUNCTION reschedule_appointment_student(UUID, DATE, TIME, TIME, UUID) TO authenticated;
