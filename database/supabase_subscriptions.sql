-- =====================================================
-- SISTEMA DE SUSCRIPCIONES - EduGestion
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Crear tabla de planes
CREATE TABLE IF NOT EXISTS public.plans (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text,
  price_monthly numeric NOT NULL,
  currency text DEFAULT 'MXN',
  features jsonb NOT NULL DEFAULT '[]',
  max_students integer,
  max_teachers integer,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Insertar planes iniciales
INSERT INTO public.plans (id, name, description, price_monthly, features, max_students, max_teachers, display_order) VALUES
('freelance', 'Freelance', 'Perfecto para tutores independientes', 399, 
 '["Hasta 50 alumnos", "Landing page personalizada", "Gestión de citas", "Pagos integrados", "Soporte por email"]'::jsonb, 
 50, 1, 1),
('academia', 'Academia', 'Ideal para academias pequeñas y medianas', 999, 
 '["Hasta 200 alumnos", "Múltiples profesores", "Landing page personalizada", "Gestión avanzada de citas", "Pagos integrados", "Reportes y estadísticas", "Soporte prioritario"]'::jsonb, 
 200, 5, 2),
('enterprise', 'Enterprise', 'Para grandes academias e instituciones', 1999, 
 '["Alumnos ilimitados", "Profesores ilimitados", "Landing pages múltiples", "API personalizada", "Integraciones avanzadas", "Soporte dedicado", "Onboarding personalizado"]'::jsonb, 
 NULL, NULL, 3)
ON CONFLICT (id) DO NOTHING;

-- 2. Crear tabla de suscripciones
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES public.plans(id),
  status text NOT NULL DEFAULT 'trial' 
    CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired', 'grace_period')),
  billing_cycle text DEFAULT 'monthly',
  
  -- Fechas del ciclo
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancelled_at timestamp with time zone,
  grace_period_end timestamp with time zone,
  
  -- Integración futura con PayPal
  payment_provider text, -- 'paypal', 'stripe', 'manual', 'simulated'
  payment_provider_customer_id text,
  payment_provider_subscription_id text,
  
  -- Créditos/Balance
  credit_balance numeric DEFAULT 0,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Crear tabla de historial de suscripciones
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  event_type text NOT NULL 
    CHECK (event_type IN ('created', 'upgraded', 'downgraded', 'renewed', 'cancelled', 'expired', 'reactivated', 'payment_success', 'payment_failed', 'trial_started', 'trial_ended', 'grace_period_started')),
  from_plan text,
  to_plan text,
  amount numeric,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Plans: Todos pueden leer los planes activos
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans" ON public.plans
  FOR SELECT USING (is_active = true);

-- Subscriptions: Solo el usuario puede ver/actualizar su suscripción
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Subscription History: Solo el usuario puede ver su historial
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history" ON public.subscription_history
  FOR SELECT USING (
    subscription_id IN (SELECT id FROM public.subscriptions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own history" ON public.subscription_history
  FOR INSERT WITH CHECK (
    subscription_id IN (SELECT id FROM public.subscriptions WHERE user_id = auth.uid())
  );

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription_id ON public.subscription_history(subscription_id);

-- =====================================================
-- FUNCIÓN: Migrar datos existentes de profiles a subscriptions
-- Ejecutar DESPUÉS de crear las tablas
-- =====================================================

-- Migrar usuarios existentes que ya tienen subscription_plan en profiles
INSERT INTO public.subscriptions (user_id, plan_id, status, trial_start, trial_end, current_period_start, current_period_end, payment_provider)
SELECT 
  p.id as user_id,
  COALESCE(p.subscription_plan, 'freelance') as plan_id,
  CASE 
    WHEN p.subscription_status = 'trial' THEN 'trial'
    WHEN p.subscription_status = 'active' THEN 'active'
    WHEN p.subscription_status = 'cancelled' THEN 'cancelled'
    WHEN p.subscription_status = 'expired' THEN 'expired'
    ELSE 'trial'
  END as status,
  p.created_at as trial_start,
  p.created_at + interval '14 days' as trial_end,
  CASE 
    WHEN p.subscription_status = 'active' THEN p.created_at
    ELSE NULL
  END as current_period_start,
  CASE 
    WHEN p.subscription_status = 'active' THEN p.created_at + interval '1 month'
    ELSE NULL
  END as current_period_end,
  'simulated' as payment_provider
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s WHERE s.user_id = p.id
);

-- Registrar la migración en el historial
INSERT INTO public.subscription_history (subscription_id, event_type, to_plan, notes)
SELECT 
  s.id,
  'created',
  s.plan_id,
  'Migrado desde profiles existente'
FROM public.subscriptions s
WHERE s.created_at >= now() - interval '1 minute';
