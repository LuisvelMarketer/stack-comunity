-- Agregar columna email a profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Agregar columna activated a pending_enrollments
ALTER TABLE public.pending_enrollments ADD COLUMN IF NOT EXISTS activated BOOLEAN DEFAULT false;

-- Renombrar amount_cents a amount_paid en pending_enrollments si existe
ALTER TABLE public.pending_enrollments RENAME COLUMN amount_cents TO amount_paid;

-- Agregar columnas faltantes a course_enrollments
ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS course_type TEXT DEFAULT 'cero';
ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS tier TEXT;
ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS amount_paid INTEGER;
ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Crear índice en profiles.email para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Crear índice en pending_enrollments para el trigger
CREATE INDEX IF NOT EXISTS idx_pending_enrollments_email_activated ON public.pending_enrollments(email, activated);