-- ==========================================================
-- RPC: RECHAZAR PROPUESTA DE EXTENSIÓN SECURELY
-- ==========================================================
-- Los estudiantes acceden de manera anónima al portal usando un access_token.
-- Como no están autenticados como 'auth.uid()', RLS bloquea los UPDATEs estándar.
-- Esta función usa SECURITY DEFINER para puentear RLS de manera segura.

CREATE OR REPLACE FUNCTION reject_extension_proposal(p_feedback_id UUID, p_access_token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id UUID;
BEGIN
  -- 1. Verificar que el token es válido y obtener el ID del estudiante
  SELECT id INTO v_student_id FROM students WHERE access_token = p_access_token;
  
  IF v_student_id IS NULL THEN
    -- Token inválido
    RETURN FALSE;
  END IF;

  -- 2. Actualizar el feedback solo si pertenece al estudiante autenticado por el token
  UPDATE student_feedback
  SET extension_proposal = NULL
  WHERE id = p_feedback_id AND student_id = v_student_id;
  
  -- FOUND es un booleano especial en plpgsql que es verdadero si el último comando modificó alguna fila
  RETURN FOUND;
END;
$$;
