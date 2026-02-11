-- ==========================================================
-- ACTUALIZACIÓN: ETIQUETAS Y PORTAL DE ALUMNO
-- ==========================================================

-- 1. Agregar columna de etiquetas (Tags)
ALTER TABLE students ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. Token de acceso para el portal del estudiante
-- Usamos gen_random_uuid() (nativo en Postgres 13+) para generar tokens únicos
ALTER TABLE students ADD COLUMN IF NOT EXISTS access_token UUID DEFAULT gen_random_uuid();

-- Actualizar registros existentes que no tengan token
UPDATE students SET access_token = gen_random_uuid() WHERE access_token IS NULL;

-- Índice para buscar rápido por token
CREATE INDEX IF NOT EXISTS idx_students_access_token ON students(access_token);

-- Asegurar unicidad del token
-- Usamos ALTER TABLE ... ADD CONSTRAINT ... con validación de existencia para evitar errores si se corre 2 veces
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_access_token_key') THEN 
        ALTER TABLE students ADD CONSTRAINT students_access_token_key UNIQUE (access_token); 
    END IF; 
END $$;


-- 3. Función segura para obtener datos del portal
-- Esta función permite obtener los datos del estudiante + feedback + materiales
-- SOLAMENTE si se proporciona el token correcto.
-- Se ejecuta como SECURITY DEFINER para saltarse las RLS normales y dar acceso controlado.

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
BEGIN
  -- 1. Buscar al estudiante y validar token
  -- Se une con 'profiles' y 'tenant_settings' para obtener info del tutor (branding)
  SELECT 
    jsonb_build_object(
      'id', s.id,
      'first_name', s.first_name,
      'last_name', s.last_name,
      'email', s.email,
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

  -- 2. Obtener Feedback
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'message', message,
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

  -- 4. Retornar todo junto en un solo JSON
  RETURN jsonb_build_object(
    'student', v_student_data,
    'feedback', COALESCE(v_feedback, '[]'::jsonb),
    'materials', COALESCE(v_materials, '[]'::jsonb)
  );
END;
$$;

-- Permitir que usuarios anónimos (el link público) ejecuten esta función
GRANT EXECUTE ON FUNCTION get_student_portal_data(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_student_portal_data(UUID) TO authenticated;
