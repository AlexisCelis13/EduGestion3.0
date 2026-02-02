-- PASO 1: Limpiar citas "fantasmas" (de alumnos que ya borraste)
-- Elimina citas donde el estudiante ya no existe (huérfanas por ID inválido)
DELETE FROM appointments 
WHERE student_id IS NOT NULL 
AND student_id NOT IN (SELECT id FROM students);

-- Elimina citas donde el student_id quedó NULL (por el borrado anterior que estaba en SET NULL)
-- ¡OJO! Solo ejecuta esta línea si estás seguro que TODAS tus citas deben tener un alumno asignado.
-- Dado nuestro nuevo flujo donde SIEMPRE creamos alumno, esto es seguro para limpiar basura vieja.
DELETE FROM appointments WHERE student_id IS NULL;


-- PASO 2: Asegurar que en el futuro se borren automáticamente
ALTER TABLE appointments
DROP CONSTRAINT IF EXISTS appointments_student_id_fkey;

ALTER TABLE appointments
ADD CONSTRAINT appointments_student_id_fkey 
FOREIGN KEY (student_id) 
REFERENCES students(id) 
ON DELETE CASCADE;
