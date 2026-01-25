-- Script corregido para limpiar todas las solicitudes de asesoría y planes de estudio antiguos
-- Ejecuta esto en el Editor SQL de Supabase para limpiar la base de datos

-- 1. Primero eliminar notificaciones relacionadas (nombre de tabla corregido)
DELETE FROM dashboard_notifications 
WHERE reference_type IN ('consultation', 'study_plan', 'new_consultation', 'plan_approved_tutor', 'plan_approved_client');

-- 2. Eliminar planes de estudio (hijos)
DELETE FROM study_plans;

-- 3. Eliminar las solicitudes de consulta (padres)
DELETE FROM consultation_requests;

-- 4. Opcional: Resetear feedbacks de prueba
-- DELETE FROM student_feedback;
