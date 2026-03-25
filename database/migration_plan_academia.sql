-- database/migration_plan_academia.sql
-- FASE 1: Tablas de Profesores y Modificaciones de Citas

-- 1. Crear Tabla de Profesores (Empleados/Tutores de la Academia)
CREATE TABLE IF NOT EXISTS professors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- El dueño de la academia
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Si el profesor tiene propio login
    name TEXT NOT NULL,
    specialty TEXT,
    bio TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en Profesores
ALTER TABLE professors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dueños pueden gestionar sus profesores" ON professors
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Profesores pueden ver su propio perfil" ON professors
    FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Perfiles de profesores son públicos para widget" ON professors
    FOR SELECT USING (is_active = TRUE);

-- 2. Tabla Puente para Matriz de Habilidades (Servicios que da cada Profesor)
CREATE TABLE IF NOT EXISTS service_professors (
    service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
    professor_id UUID REFERENCES professors(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (service_id, professor_id)
);
ALTER TABLE service_professors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dueños gestionan asignación materia-profesor" ON service_professors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM services WHERE services.id = service_professors.service_id AND services.user_id = auth.uid()
        )
    );
CREATE POLICY "Profesores y widget pueden leer asignaciones" ON service_professors
    FOR SELECT USING (TRUE);


-- 3. Modificar la Tabla de Citas (Appointments) para admitir profesores
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS professor_id UUID REFERENCES professors(id) ON DELETE SET NULL;

-- 4. Modificar Disponibilidad de Horarios
-- En lugar de "schedule_tables", la tabla correcta en EduGestion es "weekly_schedule" y "date_overrides"
ALTER TABLE weekly_schedule
ADD COLUMN IF NOT EXISTS professor_id UUID REFERENCES professors(id) ON DELETE CASCADE;

ALTER TABLE date_overrides
ADD COLUMN IF NOT EXISTS professor_id UUID REFERENCES professors(id) ON DELETE CASCADE;

-- 5. Crear un trigger básico de updated_at para professors
-- Solo crear si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_professors') THEN
    CREATE TRIGGER set_timestamp_professors
    BEFORE UPDATE ON professors
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp(); -- Usar la función existente en tu BD 
  END IF;
END
$$;