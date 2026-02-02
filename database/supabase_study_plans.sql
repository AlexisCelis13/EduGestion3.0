-- =============================================
-- MIGRACIÓN: Sistema de Asesoría Personalizada
-- =============================================
-- Ejecutar en Supabase SQL Editor

-- Tabla para almacenar consultas de asesoría personalizada
CREATE TABLE IF NOT EXISTS consultation_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tutor_id UUID REFERENCES auth.users(id) NOT NULL,
    
    -- Datos del solicitante
    booking_for TEXT NOT NULL CHECK (booking_for IN ('me', 'other')),
    student_first_name TEXT NOT NULL,
    student_last_name TEXT NOT NULL,
    student_email TEXT,
    student_phone TEXT,
    student_dob DATE,
    
    -- Datos del padre/tutor (si booking_for = 'other')
    parent_name TEXT,
    parent_email TEXT,
    parent_phone TEXT,
    
    -- Datos académicos recopilados por chatbot
    academic_level TEXT, -- primaria, secundaria, preparatoria, universidad
    subjects TEXT[], -- ['Matemáticas', 'Física']
    specific_topics TEXT, -- Descripción libre de temas a reforzar
    current_struggles TEXT, -- ¿Qué dificultades tiene?
    learning_goals TEXT, -- Objetivos de aprendizaje
    
    -- Conversación del chatbot (para contexto)
    chat_history JSONB DEFAULT '[]',
    
    -- Estado del proceso
    status TEXT DEFAULT 'pending_plan' CHECK (status IN (
        'pending_plan',      -- Esperando generación de plan
        'plan_generated',    -- Plan generado, esperando aceptación cliente
        'client_approved',   -- Cliente aceptó, esperando tutor
        'tutor_approved',    -- Tutor aprobó, esperando pago
        'paid',              -- Pagado, cita creada
        'cancelled'          -- Cancelado
    )),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla para planes de estudio generados por IA
CREATE TABLE IF NOT EXISTS study_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    consultation_id UUID REFERENCES consultation_requests(id) ON DELETE CASCADE,
    
    -- Plan generado por Gemini
    plan_title TEXT NOT NULL,
    plan_description TEXT NOT NULL,
    recommended_sessions INTEGER NOT NULL, -- Número de sesiones recomendadas
    session_duration_minutes INTEGER DEFAULT 60,
    total_hours DECIMAL(5,2),
    estimated_price DECIMAL(10,2) NOT NULL,
    
    -- Contenido estructurado del plan
    plan_content JSONB NOT NULL, -- [{ module: "Álgebra", topics: [...], sessions: 2 }, ...]
    
    -- Control de versiones (para modificaciones)
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    
    -- Aprobaciones
    client_approved_at TIMESTAMP WITH TIME ZONE,
    tutor_approved_at TIMESTAMP WITH TIME ZONE,
    tutor_notes TEXT, -- Notas del tutor al aprobar/rechazar
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla para notificaciones del dashboard
CREATE TABLE IF NOT EXISTS dashboard_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    
    type TEXT NOT NULL CHECK (type IN (
        'new_consultation',     -- Nueva solicitud de asesoría
        'plan_approved_client', -- Cliente aprobó plan
        'plan_approved_tutor',  -- Tutor aprobó plan
        'payment_received',     -- Pago recibido
        'appointment_booked'    -- Cita agendada
    )),
    
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Referencia opcional a entidad relacionada
    reference_type TEXT, -- 'consultation', 'study_plan', 'appointment'
    reference_id UUID,
    
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_consultation_requests_tutor_id ON consultation_requests(tutor_id);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_status ON consultation_requests(status);
CREATE INDEX IF NOT EXISTS idx_study_plans_consultation_id ON study_plans(consultation_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_notifications_user_id ON dashboard_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_notifications_is_read ON dashboard_notifications(is_read);

-- RLS Policies
ALTER TABLE consultation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para consultation_requests
CREATE POLICY "Tutors can view own consultations" ON consultation_requests
    FOR SELECT USING (auth.uid() = tutor_id);

CREATE POLICY "Anyone can create consultations" ON consultation_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Tutors can update own consultations" ON consultation_requests
    FOR UPDATE USING (auth.uid() = tutor_id);

-- Políticas para study_plans
CREATE POLICY "Tutors can manage study plans" ON study_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM consultation_requests cr 
            WHERE cr.id = study_plans.consultation_id 
            AND cr.tutor_id = auth.uid()
        )
    );

-- Permitir inserción pública de planes (generados por el sistema)
CREATE POLICY "System can create study plans" ON study_plans
    FOR INSERT WITH CHECK (true);

-- Políticas para dashboard_notifications
CREATE POLICY "Users can view own notifications" ON dashboard_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON dashboard_notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON dashboard_notifications
    FOR INSERT WITH CHECK (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_consultation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para consultation_requests
DROP TRIGGER IF EXISTS trigger_update_consultation_updated_at ON consultation_requests;
CREATE TRIGGER trigger_update_consultation_updated_at
    BEFORE UPDATE ON consultation_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_consultation_updated_at();

-- =============================================
-- FIN DE LA MIGRACIÓN
-- =============================================
