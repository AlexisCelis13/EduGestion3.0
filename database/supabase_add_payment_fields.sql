-- Agregar campos para el control de pagos en las citas
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0;

-- Opcional: Agregar campo de método de pago o transacción ID si fuera real
-- ADD COLUMN transaction_id TEXT;
