-- ==========================================================
-- ACTUALIZACIÓN: DEVOLVER PROPUESTA DE EXTENSIÓN EN PORTAL
-- ==========================================================
-- Recreamos la función modificada para incluir extension_proposal y user_id.

CREATE OR REPLACE FUNCTION get_student_portal_data(p_access_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id UUID;
  v_student_data JSONB;
  v_feedback JSONB;
  v_materials JSONB;
  v_recent_appointments JSONB;
BEGIN
  -- 1. Buscar al estudiante y validar token
  -- Se une con 'profiles' y 'tenant_settings' para obtener info del tutor (branding)
  SELECT 
    jsonb_build_object(
      'id', s.id,
      'first_name', s.first_name,
      'last_name', s.last_name,
      'email', s.email,
      'phone', s.phone,
      'academic_level', (
        SELECT cr.academic_level 
        FROM consultation_requests cr 
        WHERE cr.tutor_id = s.user_id 
          AND (cr.student_email = s.email OR cr.student_first_name = s.first_name)
        ORDER BY cr.created_at DESC 
        LIMIT 1
      ),
      'tutor_name', p.first_name || ' ' || COALESCE(p.last_name, ''),
      'company_name', COALESCE(p.company_name, ''), 
      'logo_url', COALESCE(ts.logo_url, ''),
      'primary_color', COALESCE(ts.primary_color, '#3B82F6'),
      'secondary_color', COALESCE(ts.secondary_color, '#1E40AF')
    )
  INTO v_student_data
  FROM students s
  -- Usamos LEFT JOIN para que el alumno pueda entrar aunque el perfil del tutor tenga problemas
  LEFT JOIN profiles p ON s.user_id = p.id
  LEFT JOIN tenant_settings ts ON s.user_id = ts.user_id
  WHERE s.access_token = p_access_token;

  IF v_student_data IS NULL THEN
    RETURN NULL; -- Token inválido o no encontrado
  END IF;

  v_student_id := (v_student_data->>'id')::UUID;

  -- 2. Obtener Feedback (AQUÍ ES DONDE SE AGREGA user_id y extension_proposal)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'user_id', user_id,
      'message', message,
      'extension_proposal', extension_proposal,
      'created_at', created_at
    ) ORDER BY created_at DESC
  )
  INTO v_feedback
  FROM student_feedback
  WHERE student_id = v_student_id;

  -- 3. Obtener Materiales
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'title', title,
      'type', type,
      'url', url,
      'description', description,
      'created_at', created_at
    ) ORDER BY created_at DESC
  )
  INTO v_materials
  FROM student_materials
  WHERE student_id = v_student_id;

  -- 3.5 Obtener Últimas Citas (Hasta 10 para detectar el patrón de horario)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'appointment_date', appointment_date,
      'duration_minutes', duration_minutes
    ) ORDER BY appointment_date DESC
  )
  INTO v_recent_appointments
  FROM (
    SELECT id, appointment_date, duration_minutes
    FROM appointments
    WHERE student_id = v_student_id
      AND status IN ('scheduled', 'completed', 'pending')
    ORDER BY appointment_date DESC
    LIMIT 10
  ) as recent_appts;

  -- 4. Retornar todo junto en un solo JSON
  RETURN jsonb_build_object(
    'student', v_student_data,
    'feedback', COALESCE(v_feedback, '[]'::jsonb),
    'materials', COALESCE(v_materials, '[]'::jsonb),
    'recent_appointments', COALESCE(v_recent_appointments, '[]'::jsonb)
  );
END;
$$;
