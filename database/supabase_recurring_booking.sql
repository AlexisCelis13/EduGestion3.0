-- ============================================
-- RECURRING BOOKING RPCs
-- ============================================

-- Function to check availability for multiple slots
-- p_slots is a JSONB array of objects: [{"date": "2026-03-01", "start_time": "10:00:00", "end_time": "11:00:00"}, ...]
CREATE OR REPLACE FUNCTION check_recurring_availability(
  p_tutor_id UUID,
  p_slots JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slot JSONB;
  v_date DATE;
  v_start_time TIME;
  v_end_time TIME;
  v_conflicts JSONB := '[]'::JSONB;
  v_is_busy BOOLEAN;
BEGIN
  FOR v_slot IN SELECT * FROM jsonb_array_elements(p_slots)
  LOOP
    v_date := (v_slot->>'date')::DATE;
    v_start_time := (v_slot->>'start_time')::TIME;
    v_end_time := (v_slot->>'end_time')::TIME;

    -- Check if there's any appointment that overlaps
    SELECT EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.user_id = p_tutor_id
        AND a.date = v_date
        AND a.status != 'cancelled'
        AND (
          (a.start_time <= v_start_time AND a.end_time > v_start_time) OR
          (a.start_time < v_end_time AND a.end_time >= v_end_time) OR
          (a.start_time >= v_start_time AND a.end_time <= v_end_time)
        )
    ) INTO v_is_busy;

    IF v_is_busy THEN
      v_conflicts := v_conflicts || v_slot;
    ELSE
      -- Check Date Overrides (full day off or specific time block)
      SELECT EXISTS (
        SELECT 1 FROM date_overrides ovr
        WHERE ovr.user_id = p_tutor_id
          AND ovr.date = v_date
          AND ovr.is_available = false
          AND (
            (ovr.start_time IS NULL AND ovr.end_time IS NULL) OR
            (ovr.start_time <= v_start_time AND ovr.end_time > v_start_time) OR
            (ovr.start_time < v_end_time AND ovr.end_time >= v_end_time) OR
            (ovr.start_time >= v_start_time AND ovr.end_time <= v_end_time)
          )
      ) INTO v_is_busy;

      IF v_is_busy THEN
        v_conflicts := v_conflicts || v_slot;
      END IF;
    END IF;
  END LOOP;

  RETURN v_conflicts;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_recurring_availability(UUID, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION check_recurring_availability(UUID, JSONB) TO authenticated;

-- Function to bulk create recurring appointments
CREATE OR REPLACE FUNCTION create_recurring_bookings(
  p_tutor_id UUID,
  p_student_name TEXT,
  p_student_last_name TEXT,
  p_student_email TEXT,
  p_student_phone TEXT,
  p_student_dob DATE,
  p_slots JSONB, -- Array of {"date", "start_time", "end_time"}
  p_service_id UUID,
  p_notes TEXT,
  p_parent_name TEXT DEFAULT NULL,
  p_parent_email TEXT DEFAULT NULL,
  p_parent_phone TEXT DEFAULT NULL,
  p_payment_status TEXT DEFAULT 'pending',
  p_amount_paid DECIMAL DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id UUID;
  v_appointment_id UUID;
  v_is_new_student BOOLEAN := FALSE;
  v_was_inactive BOOLEAN := FALSE;
  v_slot JSONB;
  v_date DATE;
  v_start_time TIME;
  v_end_time TIME;
  v_appointment_timestamp TIMESTAMPTZ;
  v_duration_min INT;
  v_appointment_ids JSONB := '[]'::JSONB;
BEGIN
  -- 1. Normalizar email
  p_student_email := LOWER(TRIM(p_student_email));
  p_parent_email := LOWER(TRIM(p_parent_email));

  -- 2. Buscar si el estudiante ya existe
  SELECT id, is_active INTO v_student_id, v_was_inactive
  FROM students 
  WHERE user_id = p_tutor_id AND email = p_student_email
  LIMIT 1;

  -- 3. Lógica de Estudiante
  IF v_student_id IS NOT NULL THEN
    IF NOT v_was_inactive THEN
       UPDATE students SET is_active = true WHERE id = v_student_id;
       v_was_inactive := TRUE;
    END IF;

    -- Update only provided fields
    IF p_student_name IS NOT NULL THEN UPDATE students SET first_name = p_student_name WHERE id = v_student_id; END IF;
    IF p_student_last_name IS NOT NULL THEN UPDATE students SET last_name = p_student_last_name WHERE id = v_student_id; END IF;
    IF p_student_phone IS NOT NULL THEN UPDATE students SET phone = p_student_phone WHERE id = v_student_id; END IF;
    IF p_student_dob IS NOT NULL THEN UPDATE students SET date_of_birth = p_student_dob WHERE id = v_student_id; END IF;
    IF p_parent_name IS NOT NULL THEN UPDATE students SET parent_name = p_parent_name WHERE id = v_student_id; END IF;
    IF p_parent_email IS NOT NULL THEN UPDATE students SET parent_email = p_parent_email WHERE id = v_student_id; END IF;
    IF p_parent_phone IS NOT NULL THEN UPDATE students SET parent_phone = p_parent_phone WHERE id = v_student_id; END IF;
  ELSE
    INSERT INTO students (
      user_id, first_name, last_name, email, phone, date_of_birth,
      parent_name, parent_email, parent_phone, is_active, tags
    ) VALUES (
      p_tutor_id, p_student_name, p_student_last_name, p_student_email, p_student_phone, p_student_dob,
      p_parent_name, p_parent_email, p_parent_phone, true, ARRAY['Nuevo']
    ) RETURNING id INTO v_student_id;
    v_is_new_student := TRUE;
  END IF;

  -- 4. Crear las Citas
  FOR v_slot IN SELECT * FROM jsonb_array_elements(p_slots)
  LOOP
    v_date := (v_slot->>'date')::DATE;
    v_start_time := (v_slot->>'start_time')::TIME;
    v_end_time := (v_slot->>'end_time')::TIME;
    v_appointment_timestamp := (v_slot->>'date' || ' ' || v_slot->>'start_time')::TIMESTAMPTZ;
    v_duration_min := EXTRACT(EPOCH FROM (v_end_time - v_start_time))/60;

    INSERT INTO appointments (
      user_id, student_id, student_name, student_email,
      date, start_time, end_time, appointment_date, duration_minutes,
      service_id, notes, status, payment_status, price
    ) VALUES (
      p_tutor_id, v_student_id, p_student_name || ' ' || COALESCE(p_student_last_name, ''), p_student_email,
      v_date, v_start_time, v_end_time, v_appointment_timestamp, v_duration_min,
      p_service_id, p_notes, 'scheduled', p_payment_status, (p_amount_paid / jsonb_array_length(p_slots))
    ) RETURNING id INTO v_appointment_id;

    v_appointment_ids := v_appointment_ids || to_jsonb(v_appointment_id);
  END LOOP;

  -- 5. Retornar resultado
  RETURN jsonb_build_object(
    'appointment_ids', v_appointment_ids,
    'student_id', v_student_id,
    'is_new_student', v_is_new_student,
    'reactivated', v_was_inactive
  );
END;
$$;

GRANT EXECUTE ON FUNCTION create_recurring_bookings TO anon;
GRANT EXECUTE ON FUNCTION create_recurring_bookings TO authenticated;
