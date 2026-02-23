-- VERIFICACIÓN DE TOKEN
-- Reemplaza el token de abajo con el que tienes en la URL para probar
-- Ejemplo: e7181a2c-549e-4fe5-9b0f-136bdd71f484

DO $$ 
DECLARE
    v_token UUID := 'e7181a2c-549e-4fe5-9b0f-136bdd71f484'; -- PON AQUÍ TU TOKEN DE LA URL
    v_count INT;
    v_student_id UUID;
BEGIN
    SELECT count(*), id INTO v_count, v_student_id FROM students WHERE access_token = v_token GROUP BY id;
    
    RAISE NOTICE '------------------------------------------';
    IF v_count > 0 THEN
        RAISE NOTICE '✅ Token ENCONTRADO para el estudiante ID: %', v_student_id;
    ELSE
        RAISE NOTICE '❌ Token NO ENCONTRADO en la tabla students.';
        RAISE NOTICE 'Verifica que hayas corrido el script de actualización anterior.';
    END IF;
    RAISE NOTICE '------------------------------------------';
END $$;
