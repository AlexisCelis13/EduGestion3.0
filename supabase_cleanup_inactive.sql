-- Limpiar citas de alumnos que fueron "eliminados" anteriormente (Soft Delete)
-- Como el sistema antes solo los marcaba como inactivos, las citas seguían ahí.
-- Este script borrará TODAS las citas asociadas a alumnos inactivos.

DELETE FROM appointments
WHERE student_id IN (SELECT id FROM students WHERE is_active = false);

-- Opcional: Si quieres borrar también a esos alumnos inactivos físicamente para limpiar la BD:
DELETE FROM students WHERE is_active = false;
