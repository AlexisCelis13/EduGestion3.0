-- =====================================================
-- SUPABASE STORAGE - Logos Bucket
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Crear el bucket para logos (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: Cualquiera puede ver los logos (públicos)
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');

-- 3. Policy: Usuarios autenticados pueden subir a su propia carpeta
CREATE POLICY "Users can upload logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy: Usuarios pueden actualizar sus propios logos
CREATE POLICY "Users can update their logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy: Usuarios pueden eliminar sus propios logos
CREATE POLICY "Users can delete their logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
