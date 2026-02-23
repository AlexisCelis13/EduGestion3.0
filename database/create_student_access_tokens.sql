-- Create table for student access tokens
CREATE TABLE IF NOT EXISTS public.student_access_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_email TEXT NOT NULL,
    token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_access_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy to allow the service role (Edge Function) to manage tokens
-- We don't want public access to this table directly
CREATE POLICY "Service role can manage access tokens"
    ON public.student_access_tokens
    USING (true)
    WITH CHECK (true);

-- Index for faster lookups by token
CREATE INDEX IF NOT EXISTS idx_student_access_tokens_token ON public.student_access_tokens(token);

-- Index for cleanup of expired tokens
CREATE INDEX IF NOT EXISTS idx_student_access_tokens_expires_at ON public.student_access_tokens(expires_at);
