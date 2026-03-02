-- ============================================
-- MODALITIES & LOCATION SCHEMA
-- Execute this in Supabase SQL Editor
-- ============================================

DO $$
BEGIN
    -- 1. Modality and Location for SERVICES (Default configuration)
    -- Options: 'virtual', 'presencial_tutor', 'presencial_alumno', 'hibrido'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'modality') THEN
        ALTER TABLE services ADD COLUMN modality TEXT DEFAULT 'virtual';
    END IF;

    -- Default location (Address for 'presencial_tutor' or Zoom Link for 'virtual')
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'default_location') THEN
        ALTER TABLE services ADD COLUMN default_location TEXT;
    END IF;


    -- 2. Modality, Link and Location for APPOINTMENTS (Specific session details)
    -- Options: 'virtual', 'presencial_tutor', 'presencial_alumno'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'modality') THEN
        ALTER TABLE appointments ADD COLUMN modality TEXT DEFAULT 'virtual';
    END IF;

    -- The actual video call link for this specific session
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'meeting_link') THEN
        ALTER TABLE appointments ADD COLUMN meeting_link TEXT;
    END IF;

    -- The actual physical address for this specific session (Tutor's address or Student's provided address)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'location') THEN
        ALTER TABLE appointments ADD COLUMN location TEXT;
    END IF;
END $$;
