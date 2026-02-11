-- Función para verificar estado del estudiante antes de reservar
-- Permite saber si es un alumno recurrente o inactivo

CREATE OR REPLACE FUNCTION check_student_status(p_tutor_id UUID, p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student RECORD;
BEGIN
  -- Buscar estudiante por email y tutor
  SELECT id, first_name, last_name, is_active 
  INTO v_student
  FROM students 
  WHERE user_id = p_tutor_id AND email = LOWER(TRIM(p_email))
  LIMIT 1;
  
  IF v_student.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'exists', true,
      'is_active', v_student.is_active,
      'first_name', v_student.first_name,
      'last_name', v_student.last_name
    );
  ELSE
    RETURN jsonb_build_object('exists', false);
  END IF;
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION check_student_status(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION check_student_status(UUID, TEXT) TO authenticated;
