-- ============================================
-- FIX: Prevenir Doble Reserva (Double Booking)
-- Fecha: Marzo 2026
-- ============================================
-- Este script aplica 3 correcciones:
-- 1. Índice UNIQUE parcial en appointments para evitar reservas duplicadas a nivel de BD
-- 2. Verificación de disponibilidad DENTRO de create_recurring_bookings antes de cada INSERT
-- 3. Verificación de disponibilidad DENTRO de create_public_booking antes del INSERT

-- ============================================================
-- 1. ÍNDICE ÚNICO PARCIAL - Previene doble reserva a nivel BD
-- ============================================================
-- Solo aplica a citas que NO están canceladas/rechazadas.
-- Esto es la última línea de defensa: si dos transacciones simultáneas
-- intentan insertar en el mismo slot, una fallará con un error de constraint.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_appointments_no_double_booking'
  ) THEN
    CREATE UNIQUE INDEX idx_appointments_no_double_booking
    ON appointments (user_id, date, start_time)
    WHERE status NOT IN ('cancelled', 'rejected');
  END IF;
END $$;

-- ============================================================
-- 2. FIX: create_recurring_bookings - Re-verificar antes de INSERT
-- ============================================================
-- Primero eliminamos todas las versiones existentes
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (SELECT oid::regprocedure as spec FROM pg_proc WHERE proname = 'create_recurring_bookings') 
    LOOP 
        EXECUTE 'DROP FUNCTION ' || r.spec; 
    END LOOP; 
END $$;

CREATE OR REPLACE FUNCTION create_recurring_bookings(
  p_tutor_id UUID,
  p_student_name TEXT,
  p_student_last_name TEXT,
  p_student_email TEXT,
  p_student_phone TEXT,
  p_student_dob DATE,
  p_slots JSONB,
  p_service_id UUID,
  p_notes TEXT,
  p_parent_name TEXT DEFAULT NULL,
  p_parent_email TEXT DEFAULT NULL,
  p_parent_phone TEXT DEFAULT NULL,
  p_payment_status TEXT DEFAULT 'pending',
  p_amount_paid NUMERIC DEFAULT 0,
  p_modality TEXT DEFAULT 'virtual',
  p_location TEXT DEFAULT NULL,
  p_meeting_link TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id UUID;
  v_appointment_id UUID;
  v_appointment_ids JSONB := '[]'::JSONB;
  v_rec RECORD;
  v_ts TIMESTAMPTZ;
  v_dur INTEGER;
  v_slots_count INTEGER;
  v_conflict_exists BOOLEAN;
BEGIN
  -- A. Get or Create Student
  SELECT id INTO v_student_id FROM students 
  WHERE user_id = p_tutor_id AND LOWER(email) = LOWER(p_student_email) LIMIT 1;
  
  IF v_student_id IS NOT NULL THEN
     UPDATE students SET is_active = true WHERE id = v_student_id;
  ELSE
    INSERT INTO students (
      user_id, first_name, last_name, email, phone, date_of_birth,
      parent_name, parent_email, parent_phone, notes, is_active
    ) VALUES (
      p_tutor_id, p_student_name, p_student_last_name, LOWER(p_student_email), p_student_phone, p_student_dob,
      p_parent_name, p_parent_email, p_parent_phone, p_notes, true
    ) RETURNING id INTO v_student_id;
  END IF;

  v_slots_count := jsonb_array_length(p_slots);

  -- B. Loop, VERIFY and Insert using jsonb_to_recordset
  FOR v_rec IN 
    SELECT date, start_time, end_time FROM jsonb_to_recordset(p_slots) AS x(date DATE, start_time TIME, end_time TIME)
  LOOP
    -- *** FIX DOBLE RESERVA: Re-verificar disponibilidad justo antes de insertar ***
    SELECT EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.user_id = p_tutor_id
        AND a.date = v_rec.date
        AND a.start_time = v_rec.start_time
        AND LOWER(a.status) NOT IN ('cancelled', 'rejected')
    ) INTO v_conflict_exists;

    IF v_conflict_exists THEN
      RAISE EXCEPTION 'El horario % a las % ya está reservado. Por favor, selecciona otro horario.', 
        v_rec.date, v_rec.start_time;
    END IF;
    -- *** FIN FIX ***

    v_ts := (v_rec.date || ' ' || v_rec.start_time)::TIMESTAMPTZ;
    v_dur := EXTRACT(EPOCH FROM (v_rec.end_time - v_rec.start_time))/60;

    INSERT INTO appointments (
      user_id, student_id, student_name, student_email,
      date, start_time, end_time, appointment_date, duration_minutes,
      service_id, notes, status, payment_status, price,
      modality, location, meeting_link
    ) VALUES (
      p_tutor_id, v_student_id, p_student_name, p_student_email,
      v_rec.date, v_rec.start_time, v_rec.end_time, v_ts, v_dur,
      p_service_id, p_notes, 'scheduled', p_payment_status, (p_amount_paid / GREATEST(v_slots_count, 1)),
      p_modality, p_location, p_meeting_link
    ) RETURNING id INTO v_appointment_id;

    v_appointment_ids := v_appointment_ids || to_jsonb(v_appointment_id);
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'appointment_ids', v_appointment_ids,
    'student_id', v_student_id
  );
END;
$$;

-- ============================================================
-- 3. FIX: create_public_booking - Verificar antes de INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION create_public_booking(
  p_tutor_id UUID,
  p_student_name TEXT,
  p_student_last_name TEXT,
  p_student_email TEXT,
  p_student_phone TEXT,
  p_student_dob DATE,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME,
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
  v_appointment_timestamp TIMESTAMPTZ;
  v_duration_min INT;
  v_conflict_exists BOOLEAN;
BEGIN
  -- 1. Normalizar email
  p_student_email := LOWER(TRIM(p_student_email));
  p_parent_email := LOWER(TRIM(p_parent_email));
  
  -- Calcular timestamp y duración
  v_appointment_timestamp := (p_date + p_start_time)::TIMESTAMPTZ;
  v_duration_min := EXTRACT(EPOCH FROM (p_end_time - p_start_time))/60;

  -- *** FIX DOBLE RESERVA: Verificar que el slot no esté ya reservado ***
  SELECT EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.user_id = p_tutor_id
      AND a.date = p_date
      AND a.start_time = p_start_time
      AND LOWER(a.status) NOT IN ('cancelled', 'rejected')
  ) INTO v_conflict_exists;

  IF v_conflict_exists THEN
    RAISE EXCEPTION 'El horario % a las % ya está reservado. Por favor, selecciona otro horario.', 
      p_date, p_start_time;
  END IF;
  -- *** FIN FIX ***

  -- 2. Buscar si el estudiante ya existe para este tutor
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

    UPDATE students SET 
        first_name = COALESCE(p_student_name, first_name),
        last_name = COALESCE(p_student_last_name, last_name),
        phone = COALESCE(p_student_phone, phone),
        date_of_birth = COALESCE(p_student_dob, date_of_birth),
        parent_name = COALESCE(p_parent_name, parent_name),
        parent_email = COALESCE(p_parent_email, parent_email),
        parent_phone = COALESCE(p_parent_phone, parent_phone)
    WHERE id = v_student_id;
    
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

  -- 4. Crear la Cita
  INSERT INTO appointments (
    user_id, student_id, date, start_time, end_time,
    appointment_date, duration_minutes,
    service_id, notes, status, payment_status, price
  ) VALUES (
    p_tutor_id, v_student_id, p_date, p_start_time, p_end_time,
    v_appointment_timestamp, v_duration_min,
    p_service_id, p_notes, 'scheduled', p_payment_status, p_amount_paid
  ) RETURNING id INTO v_appointment_id;

  -- 5. Retornar resultado
  RETURN jsonb_build_object(
    'appointment_id', v_appointment_id,
    'student_id', v_student_id,
    'is_new_student', v_is_new_student,
    'reactivated', v_was_inactive
  );
END;
$$;

-- ============================================================
-- 4. PERMISOS
-- ============================================================
GRANT EXECUTE ON FUNCTION create_recurring_bookings TO anon;
GRANT EXECUTE ON FUNCTION create_recurring_bookings TO authenticated;
GRANT EXECUTE ON FUNCTION create_public_booking TO anon;
GRANT EXECUTE ON FUNCTION create_public_booking TO authenticated;
