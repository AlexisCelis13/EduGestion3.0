-- Create the student_access_tokens table required for magic link authentication

CREATE TABLE IF NOT EXISTS public.student_access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email TEXT NOT NULL,
    token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.student_access_tokens ENABLE ROW LEVEL SECURITY;

-- Allow service role (Edge Function) to perform all operations
CREATE POLICY "Service role can do everything on student_access_tokens"
ON public.student_access_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Optional: Index on token for faster lookup
CREATE INDEX IF NOT EXISTS idx_student_access_tokens_token ON public.student_access_tokens(token);
