-- Table for level definitions with benefits
CREATE TABLE public.level_benefits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level integer NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT 'star',
  color text NOT NULL DEFAULT 'blue',
  min_points integer NOT NULL DEFAULT 0,
  benefits jsonb DEFAULT '[]'::jsonb,
  badge_url text,
  is_prestige boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table for tracking user level history
CREATE TABLE public.user_level_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  from_level integer NOT NULL,
  to_level integer NOT NULL,
  points_at_level_up integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.level_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_level_history ENABLE ROW LEVEL SECURITY;

-- Policies for level_benefits
CREATE POLICY "Anyone can view level benefits"
  ON public.level_benefits FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage level benefits"
  ON public.level_benefits FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Policies for user_level_history
CREATE POLICY "Users can view own level history"
  ON public.user_level_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert level history"
  ON public.user_level_history FOR INSERT
  WITH CHECK (true);

-- Insert default levels with benefits
INSERT INTO public.level_benefits (level, name, description, icon, color, min_points, benefits) VALUES
(1, 'Novato', 'Recién comenzando tu viaje', 'seedling', 'emerald', 0, '["Acceso básico a la plataforma", "Participación en el feed"]'),
(2, 'Aprendiz', 'Dando los primeros pasos', 'book-open', 'blue', 100, '["Badge de Aprendiz", "Comentarios ilimitados"]'),
(3, 'Estudiante', 'Comprometido con el aprendizaje', 'graduation-cap', 'indigo', 300, '["Badge de Estudiante", "Acceso a recursos exclusivos"]'),
(4, 'Practicante', 'Aplicando conocimientos', 'code', 'violet', 600, '["Badge de Practicante", "Prioridad en feedback"]'),
(5, 'Desarrollador', 'Creando proyectos reales', 'laptop', 'purple', 1000, '["Badge de Desarrollador", "Acceso a mentorías grupales"]'),
(6, 'Constructor', 'Edificando soluciones', 'hammer', 'amber', 1500, '["Badge de Constructor", "Destacado en proyectos"]'),
(7, 'Innovador', 'Pensando fuera de la caja', 'lightbulb', 'yellow', 2200, '["Badge de Innovador", "Acceso anticipado a features"]'),
(8, 'Experto', 'Dominando las habilidades', 'award', 'orange', 3000, '["Badge de Experto", "Mentorías 1:1 mensuales"]'),
(9, 'Maestro', 'Guiando a otros', 'crown', 'red', 4000, '["Badge de Maestro", "Crear contenido propio"]'),
(10, 'Leyenda', 'Alcanzaste la cima', 'trophy', 'gold', 5500, '["Badge Legendario", "Acceso VIP total", "Nombre destacado en dorado"]'),
(11, 'Prestigio I', 'Reiniciaste para mayor gloria', 'sparkles', 'rose', 7500, '["Badge de Prestigio", "Multiplicador 1.2x XP"]'),
(12, 'Prestigio II', 'Doble reinicio completado', 'star', 'pink', 10000, '["Badge Prestigio II", "Multiplicador 1.5x XP"]'),
(13, 'Prestigio III', 'La élite de la élite', 'gem', 'cyan', 15000, '["Badge Prestigio III", "Multiplicador 2x XP", "Status Legendario permanente"]');

-- Update levels 11-13 to be prestige levels
UPDATE public.level_benefits SET is_prestige = true WHERE level >= 11;

-- Function to check and update user level
CREATE OR REPLACE FUNCTION public.check_and_update_user_level()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_level integer;
  current_level integer;
BEGIN
  -- Get current level
  current_level := OLD.level;
  
  -- Calculate new level based on points
  SELECT COALESCE(MAX(level), 1) INTO new_level
  FROM level_benefits
  WHERE min_points <= NEW.points;
  
  -- If level changed, update and log
  IF new_level > current_level THEN
    NEW.level := new_level;
    
    -- Log the level up
    INSERT INTO user_level_history (user_id, from_level, to_level, points_at_level_up)
    VALUES (NEW.id, current_level, new_level, NEW.points);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to check level on points update
CREATE TRIGGER on_points_update_check_level
  BEFORE UPDATE OF points ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_update_user_level();