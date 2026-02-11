-- EJECUTA ESTO PARA VER LOS TOKENS REALES
-- Esto mostrará una lista de todos los alumnos y sus enlaces

SELECT 
  first_name || ' ' || last_name as nombre,
  email, 
  access_token,
  'http://localhost:4200/student-portal/' || access_token as enlace_prueba
FROM students
ORDER BY created_at DESC;
