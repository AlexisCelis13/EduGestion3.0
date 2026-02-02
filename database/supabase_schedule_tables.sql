-- ============================================
-- SCHEDULE MANAGEMENT TABLES (CORRECTED)
-- Execute this in Supabase SQL Editor
-- ============================================

-- 1. Availability Settings (General configuration per user)
CREATE TABLE IF NOT EXISTS availability_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_start_time TIME NOT NULL DEFAULT '08:00',
  day_end_time TIME NOT NULL DEFAULT '22:00',
  min_session_duration INTEGER NOT NULL DEFAULT 30,
  buffer_between_sessions INTEGER DEFAULT 0,
  advance_booking_days INTEGER DEFAULT 30,
  timezone TEXT DEFAULT 'America/Mexico_City',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Weekly Schedule (Recurring weekly availability)
CREATE TABLE IF NOT EXISTS weekly_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day_of_week, start_time, end_time)
);

-- 3. Date Overrides (Specific date exceptions - holidays, vacations, etc.)
-- Also supports recurring time blocks with day_of_week
CREATE TABLE IF NOT EXISTS date_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE, -- NULL for recurring blocks
  day_of_week INTEGER CHECK (day_of_week IS NULL OR day_of_week BETWEEN 0 AND 6), -- For recurring blocks
  is_available BOOLEAN DEFAULT false,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add day_of_week column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'date_overrides' AND column_name = 'day_of_week') THEN
    ALTER TABLE date_overrides ADD COLUMN day_of_week INTEGER CHECK (day_of_week IS NULL OR day_of_week BETWEEN 0 AND 6);
  END IF;
  -- Make date nullable if it isn't already
  ALTER TABLE date_overrides ALTER COLUMN date DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 4. Appointments - Add new columns to existing table if needed
-- If appointments table doesn't exist, create it. Otherwise, alter it.
DO $$
BEGIN
  -- Check if appointments table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'appointments') THEN
    CREATE TABLE appointments (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      student_id UUID REFERENCES auth.users(id),
      student_name TEXT,
      student_email TEXT,
      service_id UUID REFERENCES services(id) ON DELETE SET NULL,
      date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'student_id') THEN
      ALTER TABLE appointments ADD COLUMN student_id UUID REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'student_name') THEN
      ALTER TABLE appointments ADD COLUMN student_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'student_email') THEN
      ALTER TABLE appointments ADD COLUMN student_email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'date') THEN
      ALTER TABLE appointments ADD COLUMN date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'start_time') THEN
      ALTER TABLE appointments ADD COLUMN start_time TIME;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'end_time') THEN
      ALTER TABLE appointments ADD COLUMN end_time TIME;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'status') THEN
      ALTER TABLE appointments ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'notes') THEN
      ALTER TABLE appointments ADD COLUMN notes TEXT;
    END IF;
  END IF;
END $$;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE availability_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own availability_settings" ON availability_settings;
DROP POLICY IF EXISTS "Users can insert own availability_settings" ON availability_settings;
DROP POLICY IF EXISTS "Users can update own availability_settings" ON availability_settings;
DROP POLICY IF EXISTS "Users can view own weekly_schedule" ON weekly_schedule;
DROP POLICY IF EXISTS "Users can insert own weekly_schedule" ON weekly_schedule;
DROP POLICY IF EXISTS "Users can update own weekly_schedule" ON weekly_schedule;
DROP POLICY IF EXISTS "Users can delete own weekly_schedule" ON weekly_schedule;
DROP POLICY IF EXISTS "Users can view own date_overrides" ON date_overrides;
DROP POLICY IF EXISTS "Users can insert own date_overrides" ON date_overrides;
DROP POLICY IF EXISTS "Users can update own date_overrides" ON date_overrides;
DROP POLICY IF EXISTS "Users can delete own date_overrides" ON date_overrides;
DROP POLICY IF EXISTS "Public can view tutor availability for booking" ON availability_settings;
DROP POLICY IF EXISTS "Public can view weekly schedule for booking" ON weekly_schedule;
DROP POLICY IF EXISTS "Public can view date overrides for booking" ON date_overrides;

-- Availability Settings
CREATE POLICY "Users can view own availability_settings" ON availability_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own availability_settings" ON availability_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own availability_settings" ON availability_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Weekly Schedule
CREATE POLICY "Users can view own weekly_schedule" ON weekly_schedule
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly_schedule" ON weekly_schedule
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly_schedule" ON weekly_schedule
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly_schedule" ON weekly_schedule
  FOR DELETE USING (auth.uid() = user_id);

-- Date Overrides
CREATE POLICY "Users can view own date_overrides" ON date_overrides
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own date_overrides" ON date_overrides
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own date_overrides" ON date_overrides
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own date_overrides" ON date_overrides
  FOR DELETE USING (auth.uid() = user_id);

-- Public read access for booking
CREATE POLICY "Public can view tutor availability for booking" ON availability_settings
  FOR SELECT USING (true);

CREATE POLICY "Public can view weekly schedule for booking" ON weekly_schedule
  FOR SELECT USING (true);

CREATE POLICY "Public can view date overrides for booking" ON date_overrides
  FOR SELECT USING (true);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON appointments(user_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_student ON appointments(student_id);
CREATE INDEX IF NOT EXISTS idx_date_overrides_user_date ON date_overrides(user_id, date);
CREATE INDEX IF NOT EXISTS idx_weekly_schedule_user ON weekly_schedule(user_id);
