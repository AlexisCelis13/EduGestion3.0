-- Añadir columna de extension_proposal a student_feedback
ALTER TABLE public.student_feedback
ADD COLUMN IF NOT EXISTS extension_proposal JSONB DEFAULT NULL;
