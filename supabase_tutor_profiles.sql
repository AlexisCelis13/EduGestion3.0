-- ============================================
-- TABLA TUTOR_PROFILES
-- Información adicional del perfil del tutor
-- ============================================

CREATE TABLE IF NOT EXISTS tutor_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  bio TEXT,
  years_experience INTEGER,
  certifications TEXT,
  work_experience TEXT,
  subjects TEXT,
  teaching_methodology TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsqueda por user_id
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_user_id ON tutor_profiles(user_id);

-- RLS policy
ALTER TABLE tutor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tutor profile" ON tutor_profiles 
FOR ALL USING (auth.uid() = user_id);
