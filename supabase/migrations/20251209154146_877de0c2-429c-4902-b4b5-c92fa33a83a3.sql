-- Create daily challenges table
CREATE TABLE public.daily_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL DEFAULT 'activity', -- activity, learning, social, streak
  target_count INTEGER NOT NULL DEFAULT 1,
  xp_reward INTEGER NOT NULL DEFAULT 10,
  icon TEXT NOT NULL DEFAULT 'target',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user daily challenge progress
CREATE TABLE public.user_daily_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_progress INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  xp_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id, challenge_date)
);

-- Create weekly missions table
CREATE TABLE public.weekly_missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  mission_type TEXT NOT NULL DEFAULT 'progress', -- progress, engagement, mastery
  target_count INTEGER NOT NULL DEFAULT 5,
  xp_reward INTEGER NOT NULL DEFAULT 100,
  badge_reward TEXT, -- optional badge name to unlock
  icon TEXT NOT NULL DEFAULT 'trophy',
  difficulty TEXT NOT NULL DEFAULT 'medium', -- easy, medium, hard
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user weekly mission progress
CREATE TABLE public.user_weekly_missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mission_id UUID NOT NULL REFERENCES public.weekly_missions(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  current_progress INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  xp_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_id, week_start)
);

-- Enable RLS
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_weekly_missions ENABLE ROW LEVEL SECURITY;

-- Policies for daily_challenges
CREATE POLICY "Anyone can view active daily challenges" ON public.daily_challenges
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage daily challenges" ON public.daily_challenges
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies for user_daily_challenges
CREATE POLICY "Users can view own daily challenges" ON public.user_daily_challenges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily challenges" ON public.user_daily_challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily challenges" ON public.user_daily_challenges
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for weekly_missions
CREATE POLICY "Anyone can view active weekly missions" ON public.weekly_missions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage weekly missions" ON public.weekly_missions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies for user_weekly_missions
CREATE POLICY "Users can view own weekly missions" ON public.user_weekly_missions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly missions" ON public.user_weekly_missions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly missions" ON public.user_weekly_missions
  FOR UPDATE USING (auth.uid() = user_id);

-- Insert default daily challenges
INSERT INTO public.daily_challenges (title, description, challenge_type, target_count, xp_reward, icon) VALUES
('Primera conexión', 'Inicia sesión en la plataforma', 'activity', 1, 5, 'log-in'),
('Estudiante dedicado', 'Completa 1 módulo de cualquier curso', 'learning', 1, 20, 'book-open'),
('Participación activa', 'Comenta en una publicación o módulo', 'social', 1, 10, 'message-circle'),
('Explorador', 'Visita 3 comunidades diferentes', 'activity', 3, 15, 'compass'),
('Ayudante', 'Da feedback en un proyecto de Build in Public', 'social', 1, 25, 'thumbs-up');

-- Insert default weekly missions
INSERT INTO public.weekly_missions (title, description, mission_type, target_count, xp_reward, icon, difficulty) VALUES
('Aprendiz constante', 'Completa 5 módulos esta semana', 'progress', 5, 150, 'graduation-cap', 'medium'),
('Constructor activo', 'Publica 2 actualizaciones en tu proyecto', 'engagement', 2, 100, 'hammer', 'easy'),
('Tester estrella', 'Da feedback en 5 proyectos diferentes', 'engagement', 5, 200, 'star', 'hard'),
('Racha de fuego', 'Mantén una racha de 7 días', 'mastery', 7, 250, 'flame', 'hard'),
('Comunidad unida', 'Interactúa en 3 comunidades', 'social', 3, 100, 'users', 'medium');