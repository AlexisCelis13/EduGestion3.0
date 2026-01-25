-- ============================================
-- STUDENTS FEATURES - Feedback y Materiales
-- ============================================

-- Tabla para feedback a estudiantes
CREATE TABLE IF NOT EXISTS student_feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para materiales compartidos con estudiantes
CREATE TABLE IF NOT EXISTS student_materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('pdf', 'doc', 'link')) NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_student_feedback_student_id ON student_feedback(student_id);
CREATE INDEX IF NOT EXISTS idx_student_feedback_user_id ON student_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_student_materials_student_id ON student_materials(student_id);
CREATE INDEX IF NOT EXISTS idx_student_materials_user_id ON student_materials(user_id);

-- RLS policies
ALTER TABLE student_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_materials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage own feedback" ON student_feedback;
DROP POLICY IF EXISTS "Users can manage own materials" ON student_materials;

-- Create policies
CREATE POLICY "Users can manage own feedback" ON student_feedback FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own materials" ON student_materials FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKET PARA MATERIALES
-- ============================================
-- Ejecuta esto en Supabase Dashboard > Storage > New Bucket
-- Nombre: student-materials
-- Public: false
-- File size limit: 10MB
-- Allowed MIME types: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

-- O ejecuta este SQL para crear el bucket y policies:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-materials',
  'student-materials',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Users can upload student materials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'student-materials' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own student materials"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'student-materials' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own student materials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'student-materials' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
