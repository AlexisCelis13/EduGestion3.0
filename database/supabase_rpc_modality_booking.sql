-- ==========================================================
-- DEFINITIVE FIX FOR BOOKING RPCS (Resolves operator does not exist: text ->> unknown)
-- ==========================================================

DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    -- 1. DROP ALL VERSIONS regardless of signature to avoid "function not unique" or 404 mismatch
    FOR r IN (SELECT oid::regprocedure as spec FROM pg_proc WHERE proname = 'create_recurring_bookings') 
    LOOP 
        EXECUTE 'DROP FUNCTION ' || r.spec; 
    END LOOP; 

    FOR r IN (SELECT oid::regprocedure as spec FROM pg_proc WHERE proname = 'check_recurring_availability') 
    LOOP 
        EXECUTE 'DROP FUNCTION ' || r.spec; 
    END LOOP;

    -- 2. ENSURE APPOINTMENTS TABLE HAS ALL COLUMNS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'price') THEN
        ALTER TABLE appointments ADD COLUMN price NUMERIC(10,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'payment_status') THEN
        ALTER TABLE appointments ADD COLUMN payment_status TEXT DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'modality') THEN
        ALTER TABLE appointments ADD COLUMN modality TEXT DEFAULT 'virtual';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'location') THEN
        ALTER TABLE appointments ADD COLUMN location TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'meeting_link') THEN
        ALTER TABLE appointments ADD COLUMN meeting_link TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'date') THEN
        ALTER TABLE appointments ADD COLUMN date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'start_time') THEN
        ALTER TABLE appointments ADD COLUMN start_time TIME;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'end_time') THEN
        ALTER TABLE appointments ADD COLUMN end_time TIME;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'appointment_date') THEN
        ALTER TABLE appointments ADD COLUMN appointment_date TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'duration_minutes') THEN
        ALTER TABLE appointments ADD COLUMN duration_minutes INTEGER DEFAULT 60;
    END IF;
END $$;

-- 3. CREATE RECURRING AVAILABILITY CHECK
CREATE OR REPLACE FUNCTION check_recurring_availability(
  p_tutor_id UUID,
  p_slots JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rec RECORD;
  v_conflicts JSONB := '[]'::JSONB;
  v_is_busy BOOLEAN;
BEGIN
  -- Use jsonb_to_recordset to avoid "text ->> unknown" errors entirely
  FOR v_rec IN 
    SELECT date, start_time, end_time FROM jsonb_to_recordset(p_slots) AS x(date DATE, start_time TIME, end_time TIME)
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.user_id = p_tutor_id
        AND (
          a.date = v_rec.date 
          OR (a.appointment_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City')::DATE = v_rec.date
        )
        AND LOWER(a.status) NOT IN ('cancelled', 'rejected')
        AND (
          (a.start_time <= v_rec.start_time AND a.end_time > v_rec.start_time) OR
          (a.start_time < v_rec.end_time AND a.end_time >= v_rec.end_time) OR
          (a.start_time >= v_rec.start_time AND a.end_time <= v_rec.end_time)
        )
    ) INTO v_is_busy;

    IF v_is_busy THEN
      v_conflicts := v_conflicts || jsonb_build_object('date', v_rec.date, 'start_time', v_rec.start_time, 'end_time', v_rec.end_time);
    ELSE
      SELECT EXISTS (
        SELECT 1 FROM date_overrides ovr
        WHERE ovr.user_id = p_tutor_id
          AND ovr.date = v_rec.date
          AND ovr.is_available = false
          AND (
            (ovr.start_time IS NULL AND ovr.end_time IS NULL) OR
            (ovr.start_time <= v_rec.start_time AND ovr.end_time > v_rec.start_time) OR
            (ovr.start_time < v_rec.end_time AND ovr.end_time >= v_rec.end_time) OR
            (ovr.start_time >= v_rec.start_time AND ovr.end_time <= v_rec.end_time)
          )
      ) INTO v_is_busy;

      IF v_is_busy THEN
        v_conflicts := v_conflicts || jsonb_build_object('date', v_rec.date, 'start_time', v_rec.start_time, 'end_time', v_rec.end_time);
      END IF;
    END IF;
  END LOOP;
  RETURN v_conflicts;
END;
$$;

-- 4. CREATE THE DEFINITIVE BOOKING RPC
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

  -- B. Loop and Insert using jsonb_to_recordset for maximum safety
  FOR v_rec IN 
    SELECT date, start_time, end_time FROM jsonb_to_recordset(p_slots) AS x(date DATE, start_time TIME, end_time TIME)
  LOOP
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

-- 5. GRANTS
GRANT EXECUTE ON FUNCTION check_recurring_availability(UUID, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION check_recurring_availability(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION create_recurring_bookings TO anon;
GRANT EXECUTE ON FUNCTION create_recurring_bookings TO authenticated;

-- 5. GRANTS
GRANT EXECUTE ON FUNCTION check_recurring_availability(UUID, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION check_recurring_availability(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION create_recurring_bookings TO anon;
GRANT EXECUTE ON FUNCTION create_recurring_bookings TO authenticated;

-- 4. Permissions
GRANT EXECUTE ON FUNCTION check_recurring_availability(UUID, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION check_recurring_availability(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION create_recurring_bookings TO anon;
GRANT EXECUTE ON FUNCTION create_recurring_bookings TO authenticated;
