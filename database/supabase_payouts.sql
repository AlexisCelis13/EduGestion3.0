-- Tabla para guardar la configuración de cobros del tutor (Simulación de Stripe Connect)
CREATE TABLE IF NOT EXISTS payout_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL, -- CLABE o Número de cuenta (enmascarado en UI)
    account_holder TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT true, -- Simulación de verificación
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE payout_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payout settings" ON payout_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert/update own payout settings" ON payout_settings
    FOR ALL USING (auth.uid() = user_id);
