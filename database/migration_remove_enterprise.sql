-- =====================================================
-- MIGRACIÓN: Eliminar plan Enterprise, ajustar precios
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Actualizar precios de planes existentes
UPDATE public.plans SET price_monthly = 199 WHERE id = 'freelance';
UPDATE public.plans SET price_monthly = 299 WHERE id = 'academia';

-- 2. Migrar suscripciones Enterprise → Academia
UPDATE public.subscriptions SET plan_id = 'academia' WHERE plan_id = 'enterprise';

-- 3. Migrar profiles Enterprise → Academia
UPDATE public.profiles SET subscription_plan = 'academia' WHERE subscription_plan = 'enterprise';

-- 4. Desactivar plan Enterprise (no eliminar para mantener historial)
UPDATE public.plans SET is_active = false WHERE id = 'enterprise';

-- 5. Registrar la migración en historial
INSERT INTO public.subscription_history (subscription_id, event_type, from_plan, to_plan, notes)
SELECT 
  s.id,
  'downgraded',
  'enterprise',
  'academia',
  'Migración automática: plan Enterprise eliminado, usuarios movidos a Academia'
FROM public.subscriptions s
WHERE s.plan_id = 'academia'
  AND EXISTS (
    SELECT 1 FROM public.subscription_history sh 
    WHERE sh.subscription_id = s.id 
    AND (sh.to_plan = 'enterprise' OR sh.from_plan = 'enterprise')
  );
