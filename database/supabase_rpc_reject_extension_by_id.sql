-- ==========================================================
-- ACTUALIZACIÓN: RECHAZAR O DESCARTAR PROPUESTA DE EXTENSIÓN
-- ==========================================================
-- Esta función simplificada utiliza el ID de feedback (UUID incognoscible)
-- como identificador seguro para poder permitir el descarte desde el
-- Portal del Estudiante tanto para links heredados (UUID) como Magic Links (JWT).

CREATE OR REPLACE FUNCTION reject_extension_proposal_by_id(p_feedback_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Actualizar el feedback para borrar la propuesta ('Descartar')
  UPDATE student_feedback
  SET extension_proposal = NULL
  WHERE id = p_feedback_id;
  
  RETURN FOUND;
END;
$$;
