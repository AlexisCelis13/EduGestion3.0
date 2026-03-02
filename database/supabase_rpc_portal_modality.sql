-- ==========================================================
-- ACTUALIZACIÓN: DEVOLVER DATOS DE MODALIDAD EN PORTAL DEL ALUMNO
-- ==========================================================
-- Añade modalidad, location, meeting_link y notas a las citas en el portal

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
  v_appointments JSONB;
BEGIN
  -- 1. Buscar al estudiante y validar token
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
  LEFT JOIN profiles p ON s.user_id = p.id
  LEFT JOIN tenant_settings ts ON s.user_id = ts.user_id
  WHERE s.access_token = p_access_token;

  IF v_student_data IS NULL THEN
    RETURN NULL;
  END IF;

  v_student_id := (v_student_data->>'id')::UUID;

  -- 2. Obtener Feedback
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

  -- 3.5 Obtener TODAS las Citas
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'date', a.date,
      'start_time', a.start_time,
      'end_time', a.end_time,
      'status', a.status,
      'duration_minutes', EXTRACT(EPOCH FROM (a.end_time - a.start_time))/60,
      'service_id', a.service_id,
      'notes', a.notes,
      'modality', a.modality,
      'location', a.location,
      'meeting_link', a.meeting_link,
      'created_at', a.created_at
    ) ORDER BY a.date DESC, a.start_time DESC
  )
  INTO v_appointments
  FROM appointments a
  WHERE a.student_id = v_student_id
    AND a.status IN ('scheduled', 'confirmed', 'completed', 'pending');

  -- 4. Retornar todo junto en un solo JSON
  RETURN jsonb_build_object(
    'student', v_student_data,
    'feedback', COALESCE(v_feedback, '[]'::jsonb),
    'materials', COALESCE(v_materials, '[]'::jsonb),
    'appointments', COALESCE(v_appointments, '[]'::jsonb)
  );
END;
$$;
