CREATE TABLE public.pending_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  course_type TEXT NOT NULL DEFAULT 'cero',
  tier TEXT,
  amount_cents INTEGER,
  currency TEXT,
  purchase_date TIMESTAMPTZ,
  stripe_session_id TEXT,
  source TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ,
  UNIQUE(email, course_type)
);

ALTER TABLE public.pending_enrollments ENABLE ROW LEVEL SECURITY;

-- Policy para permitir al service role insertar/actualizar
CREATE POLICY "Service role full access on pending_enrollments"
ON public.pending_enrollments
FOR ALL
USING (true)
WITH CHECK (true);