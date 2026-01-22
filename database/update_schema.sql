-- Script de actualización para EduGestión
-- Ejecuta solo las partes que faltan

-- Verificar si las tablas existen antes de crearlas
DO $$ 
BEGIN
    -- Crear tabla tenant_settings si no existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tenant_settings') THEN
        CREATE TABLE tenant_settings (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          logo_url TEXT,
          primary_color TEXT DEFAULT '#3B82F6',
          secondary_color TEXT DEFAULT '#1E40AF',
          company_description TEXT,
          contact_email TEXT,
          contact_phone TEXT,
          address TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Crear tabla services si no existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'services') THEN
        CREATE TABLE services (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          duration_minutes INTEGER DEFAULT 60,
          category TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Crear tabla students si no existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'students') THEN
        CREATE TABLE students (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          date_of_birth DATE,
          parent_name TEXT,
          parent_email TEXT,
          parent_phone TEXT,
          notes TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Crear tabla appointments si no existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'appointments') THEN
        CREATE TABLE appointments (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
          student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
          service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
          appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
          duration_minutes INTEGER NOT NULL,
          status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Crear tabla payments si no existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payments') THEN
        CREATE TABLE payments (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
          student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
          appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
          amount DECIMAL(10,2) NOT NULL,
          currency TEXT DEFAULT 'MXN',
          status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
          stripe_payment_intent_id TEXT,
          payment_date TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Crear tabla onboarding_progress si no existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'onboarding_progress') THEN
        CREATE TABLE onboarding_progress (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
          step_name TEXT NOT NULL,
          completed BOOLEAN DEFAULT FALSE,
          completed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, step_name)
        );
    END IF;
END $$;

-- Agregar columnas faltantes a profiles si no existen
DO $$ 
BEGIN
    -- Agregar company_name si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_name') THEN
        ALTER TABLE profiles ADD COLUMN company_name TEXT;
    END IF;

    -- Agregar role si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role TEXT CHECK (role IN ('director', 'tutor_independiente')) DEFAULT 'tutor_independiente';
    END IF;

    -- Agregar estimated_monthly_income si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'estimated_monthly_income') THEN
        ALTER TABLE profiles ADD COLUMN estimated_monthly_income DECIMAL(10,2);
    END IF;

    -- Agregar onboarding_completed si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_completed') THEN
        ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
    END IF;

    -- Agregar subscription_status si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_status') THEN
        ALTER TABLE profiles ADD COLUMN subscription_status TEXT CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired')) DEFAULT 'trial';
    END IF;

    -- Agregar subscription_plan si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_plan') THEN
        ALTER TABLE profiles ADD COLUMN subscription_plan TEXT CHECK (subscription_plan IN ('freelance', 'academia', 'enterprise'));
    END IF;

    -- Agregar first_name si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_name') THEN
        ALTER TABLE profiles ADD COLUMN first_name TEXT;
    END IF;

    -- Agregar last_name si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_name') THEN
        ALTER TABLE profiles ADD COLUMN last_name TEXT;
    END IF;
END $$;

-- Crear índices si no existen
DO $$
BEGIN
    -- Índices para tenant_settings
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tenant_settings_slug') THEN
        CREATE INDEX idx_tenant_settings_slug ON tenant_settings(slug);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tenant_settings_user_id') THEN
        CREATE INDEX idx_tenant_settings_user_id ON tenant_settings(user_id);
    END IF;

    -- Índices para services
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_services_user_id') THEN
        CREATE INDEX idx_services_user_id ON services(user_id);
    END IF;

    -- Índices para students
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_students_user_id') THEN
        CREATE INDEX idx_students_user_id ON students(user_id);
    END IF;

    -- Índices para appointments
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_appointments_user_id') THEN
        CREATE INDEX idx_appointments_user_id ON appointments(user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_appointments_date') THEN
        CREATE INDEX idx_appointments_date ON appointments(appointment_date);
    END IF;

    -- Índices para payments
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_user_id') THEN
        CREATE INDEX idx_payments_user_id ON payments(user_id);
    END IF;

    -- Índices para onboarding_progress
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_onboarding_progress_user_id') THEN
        CREATE INDEX idx_onboarding_progress_user_id ON onboarding_progress(user_id);
    END IF;
END $$;

-- Habilitar RLS en las nuevas tablas
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
DO $$
BEGIN
    -- Políticas para tenant_settings
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own tenant settings' AND tablename = 'tenant_settings') THEN
        CREATE POLICY "Users can manage own tenant settings" ON tenant_settings FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view active tenant settings' AND tablename = 'tenant_settings') THEN
        CREATE POLICY "Public can view active tenant settings" ON tenant_settings FOR SELECT USING (is_active = true);
    END IF;

    -- Políticas para services
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own services' AND tablename = 'services') THEN
        CREATE POLICY "Users can manage own services" ON services FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view active services' AND tablename = 'services') THEN
        CREATE POLICY "Public can view active services" ON services FOR SELECT USING (is_active = true);
    END IF;

    -- Políticas para students
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own students' AND tablename = 'students') THEN
        CREATE POLICY "Users can manage own students" ON students FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Políticas para appointments
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own appointments' AND tablename = 'appointments') THEN
        CREATE POLICY "Users can manage own appointments" ON appointments FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Políticas para payments
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own payments' AND tablename = 'payments') THEN
        CREATE POLICY "Users can manage own payments" ON payments FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Políticas para onboarding_progress
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own onboarding progress' AND tablename = 'onboarding_progress') THEN
        CREATE POLICY "Users can manage own onboarding progress" ON onboarding_progress FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Crear función para updated_at si no existe
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tenant_settings_updated_at') THEN
        CREATE TRIGGER tenant_settings_updated_at BEFORE UPDATE ON tenant_settings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'services_updated_at') THEN
        CREATE TRIGGER services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'students_updated_at') THEN
        CREATE TRIGGER students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'appointments_updated_at') THEN
        CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'payments_updated_at') THEN
        CREATE TRIGGER payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
    END IF;
END $$;