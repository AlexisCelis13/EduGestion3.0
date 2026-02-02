-- =====================================================
-- FIX: Eliminar registros duplicados en tenant_settings
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Ver cuántos duplicados hay
SELECT user_id, COUNT(*) as count 
FROM tenant_settings 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- 2. Eliminar duplicados, manteniendo solo el registro más reciente
-- (Comentado por seguridad - ejecuta primero el SELECT para ver qué hay)
/*
DELETE FROM tenant_settings
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM tenant_settings
  ORDER BY user_id, created_at DESC NULLS LAST, id DESC
);
*/

-- 3. Agregar UNIQUE constraint para evitar duplicados futuros
-- (Solo ejecutar después de eliminar duplicados)
/*
ALTER TABLE tenant_settings 
ADD CONSTRAINT tenant_settings_user_id_unique UNIQUE (user_id);
*/
