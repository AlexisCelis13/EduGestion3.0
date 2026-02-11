-- =========================================================
-- SOLUCION AL ERROR 401 EN REGISTRO
-- Ejecuta este script en el Editor SQL de Supabase
-- =========================================================

-- Esta función asegura que cuando un usuario se registra, 
-- se creen sus datos automáticamente SIN necesitar permisos desde el frontend.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Crear Perfil con datos por defecto
  INSERT INTO public.profiles (id, email, subscription_status, subscription_plan)
  VALUES (NEW.id, NEW.email, 'trial', 'freelance')
  ON CONFLICT (id) DO NOTHING;
  
  -- 2. Crear Suscripción de Prueba (14 días)
  INSERT INTO public.subscriptions (user_id, plan_id, status, trial_start, trial_end)
  VALUES (
    NEW.id, 
    'freelance', 
    'trial',
    now(),
    now() + interval '14 days'
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Configuración Inicial del Tenant (Landing Page basica)
  INSERT INTO public.tenant_settings (user_id, slug, primary_color, secondary_color, is_active)
  VALUES (
    NEW.id, 
    lower(substring(NEW.email from 1 for 8)) || '-' || floor(random() * 1000)::text,
    '#3B82F6', 
    '#1E40AF', 
    true
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Asegurarnos de que el trigger esté activo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
