
-- This script replaces the old unique constraint on weekly_schedule
-- so that different professors (and the academy) can have overlapping time slots.

DO \$\$
DECLARE
  constraint_name text;
BEGIN
  -- Reemplazar la restriccion unica de weekly_schedule
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name)
  WHERE tc.table_name = 'weekly_schedule' AND tc.constraint_type = 'UNIQUE'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE weekly_schedule DROP CONSTRAINT ' || constraint_name;
  END IF;
END \$\$;

-- Crear un nuevo indice unico que toma en cuenta a los profesores
-- COALESCE(professor_id, ...) asegura que los horarios de la academia (null) 
-- y de profesores especificos no causen colisiones ni se sobrescriban.
DROP INDEX IF EXISTS idx_weekly_schedule_unique;
CREATE UNIQUE INDEX idx_weekly_schedule_unique 
ON weekly_schedule (
  user_id, 
  COALESCE(professor_id, '00000000-0000-0000-0000-000000000000'::uuid), 
  day_of_week, 
  start_time, 
  end_time
);

