-- =====================================================
-- MIGRACIÓN: Agregar PayPal como método de cobro
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Agregar columna para tipo de método de pago
ALTER TABLE payout_settings ADD COLUMN IF NOT EXISTS payout_type TEXT DEFAULT 'bank';

-- 2. Agregar columna para email de PayPal
ALTER TABLE payout_settings ADD COLUMN IF NOT EXISTS paypal_email TEXT;

-- 3. Hacer campos bancarios nullable (un usuario con PayPal no los necesita)
ALTER TABLE payout_settings ALTER COLUMN bank_name DROP NOT NULL;
ALTER TABLE payout_settings ALTER COLUMN account_number DROP NOT NULL;
ALTER TABLE payout_settings ALTER COLUMN account_holder DROP NOT NULL;
