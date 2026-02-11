-- ============================================
-- FUNCIÓN DE RESERVA PÚBLICA INTELIGENTE
-- Creada: Feb 2026
-- ============================================

-- Esta función maneja TODA la lógica de crear una cita:
-- 1. Verifica si el estudiante ya existe (por email)
-- 2. Si existe y está inactivo -> Lo reactiva (is_active = true)
-- 3. Si no existe -> Lo crea automáticamente
-- 4. Finalmente crea la cita vinculada a ese estudiante

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
BEGIN
  -- 1. Normalizar email
  p_student_email := LOWER(TRIM(p_student_email));
  p_parent_email := LOWER(TRIM(p_parent_email));
  
  -- Calcular timestamp y duración para compatibilidad con esquema antiguo
  v_appointment_timestamp := (p_date + p_start_time)::TIMESTAMPTZ;
  v_duration_min := EXTRACT(EPOCH FROM (p_end_time - p_start_time))/60;

  -- 2. Buscar si el estudiante ya existe para este tutor
  SELECT id, is_active INTO v_student_id, v_was_inactive
  FROM students 
  WHERE user_id = p_tutor_id AND email = p_student_email
  LIMIT 1;

  -- 3. Lógica de Estudiante
  IF v_student_id IS NOT NULL THEN
    -- A) Estudiante EXISTE
    -- Si estaba inactivo, lo reactivamos automáticamente al reservar
    IF NOT v_was_inactive THEN
       UPDATE students SET is_active = true WHERE id = v_student_id;
       v_was_inactive := TRUE; -- Para flag de retorno
    END IF;

    -- Opcional: Actualizar teléfono o datos si vinieron nuevos (aquí solo actualizamos lo básico si hace falta)
    -- Actualizamos los datos del perfil con la información reciente de la reserva
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
    -- B) Estudiante NUEVO -> Crear registro
    INSERT INTO students (
      user_id, 
      first_name, 
      last_name, 
      email, 
      phone, 
      date_of_birth,
      parent_name,
      parent_email,
      parent_phone,
      is_active,
      tags
    ) VALUES (
      p_tutor_id,
      p_student_name,
      p_student_last_name,
      p_student_email,
      p_student_phone,
      p_student_dob,
      p_parent_name,
      p_parent_email,
      p_parent_phone,
      true, -- Se crea activo
      ARRAY['Nuevo'] -- Etiqueta automática
    ) RETURNING id INTO v_student_id;
    
    v_is_new_student := TRUE;
  END IF;

  -- 4. Crear la Cita
  INSERT INTO appointments (
    user_id,
    student_id,
    date,
    start_time,
    end_time,
    appointment_date, -- Campo legacy/principal requerido
    duration_minutes, -- Campo legacy/principal requerido
    service_id,
    notes,
    status,
    payment_status,
    price
  ) VALUES (
    p_tutor_id,
    v_student_id,
    p_date,
    p_start_time,
    p_end_time,
    v_appointment_timestamp,
    v_duration_min,
    p_service_id,
    p_notes,
    'scheduled', -- Cambiado de 'confirmed' a 'scheduled' para coincidir con el constraint de la BD
    p_payment_status,
    p_amount_paid
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

-- Permisos públicos
GRANT EXECUTE ON FUNCTION create_public_booking TO anon;
GRANT EXECUTE ON FUNCTION create_public_booking TO authenticated;
