-- Cambiar la constraint de appointments para que borre las citas si se borra el alumno
ALTER TABLE appointments
DROP CONSTRAINT IF EXISTS appointments_student_id_fkey;

ALTER TABLE appointments
ADD CONSTRAINT appointments_student_id_fkey 
FOREIGN KEY (student_id) 
REFERENCES students(id) 
ON DELETE CASCADE;
