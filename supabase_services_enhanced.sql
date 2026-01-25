-- ============================================
-- ENHANCED SERVICES SCHEMA
-- Execute this in Supabase SQL Editor
-- ============================================

-- Add new columns to services table for better description
DO $$
BEGIN
    -- Target Audience / Level (e.g. "Primaria", "Secundaria", "Universidad")
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'target_level') THEN
        ALTER TABLE services ADD COLUMN target_level TEXT;
    END IF;

    -- Topics covered (Array of strings)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'topics') THEN
        ALTER TABLE services ADD COLUMN topics TEXT[];
    END IF;

    -- Methodology / Approach description
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'methodology') THEN
        ALTER TABLE services ADD COLUMN methodology TEXT;
    END IF;

    -- Language of instruction
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'language') THEN
        ALTER TABLE services ADD COLUMN language TEXT DEFAULT 'Español';
    END IF;

    -- Prerequisites
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'prerequisites') THEN
        ALTER TABLE services ADD COLUMN prerequisites TEXT;
    END IF;
END $$;
