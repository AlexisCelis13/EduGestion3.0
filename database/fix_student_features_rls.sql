-- ============================================
-- FIX: Student Feedback & Materials RLS Policies
-- Run this in Supabase SQL Editor
-- ============================================

-- Ensure RLS is enabled
ALTER TABLE student_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_materials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage own feedback" ON student_feedback;
DROP POLICY IF EXISTS "Users can view own feedback" ON student_feedback;
DROP POLICY IF EXISTS "Users can insert own feedback" ON student_feedback;
DROP POLICY IF EXISTS "Users can delete own feedback" ON student_feedback;

DROP POLICY IF EXISTS "Users can manage own materials" ON student_materials;
DROP POLICY IF EXISTS "Users can view own materials" ON student_materials;
DROP POLICY IF EXISTS "Users can insert own materials" ON student_materials;
DROP POLICY IF EXISTS "Users can delete own materials" ON student_materials;

-- Create separate policies for each operation (more reliable than FOR ALL)

-- FEEDBACK POLICIES
CREATE POLICY "Users can view own feedback" ON student_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback" ON student_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback" ON student_feedback
  FOR DELETE USING (auth.uid() = user_id);

-- MATERIALS POLICIES
CREATE POLICY "Users can view own materials" ON student_materials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own materials" ON student_materials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own materials" ON student_materials
  FOR DELETE USING (auth.uid() = user_id);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('student_feedback', 'student_materials');
