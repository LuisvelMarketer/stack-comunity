-- Create seasons/competitions table
CREATE TABLE public.seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended')),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Season prizes table
CREATE TABLE public.season_prizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  prize_type TEXT NOT NULL CHECK (prize_type IN ('badge', 'monetary', 'premium_access', 'certificate')),
  rank_type TEXT NOT NULL CHECK (rank_type IN ('top_tester', 'top_project')),
  position INTEGER NOT NULL, -- 1st, 2nd, 3rd place
  name TEXT NOT NULL,
  description TEXT,
  value TEXT, -- Could be badge name, amount, or access description
  icon TEXT DEFAULT 'trophy',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Track user points per season
CREATE TABLE public.season_user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  feedback_count INTEGER NOT NULL DEFAULT 0,
  resolved_feedback_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(season_id, user_id)
);

-- Track project scores per season
CREATE TABLE public.season_project_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.build_projects(id) ON DELETE CASCADE,
  feedback_count INTEGER NOT NULL DEFAULT 0,
  resolved_feedback_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  followers_count INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(season_id, project_id)
);

-- Track prize winners
CREATE TABLE public.season_winners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  prize_id UUID NOT NULL REFERENCES public.season_prizes(id) ON DELETE CASCADE,
  user_id UUID, -- For top_tester prizes
  project_id UUID REFERENCES public.build_projects(id) ON DELETE SET NULL, -- For top_project prizes
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(prize_id)
);

-- Enable RLS
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_project_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_winners ENABLE ROW LEVEL SECURITY;

-- Policies for seasons
CREATE POLICY "Anyone can view active seasons" ON public.seasons
  FOR SELECT USING (status IN ('active', 'ended'));

CREATE POLICY "Admins can manage all seasons" ON public.seasons
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can manage community seasons" ON public.seasons
  FOR ALL USING (
    community_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = seasons.community_id
      AND user_id = auth.uid()
      AND is_owner = true
    )
  );

-- Policies for prizes
CREATE POLICY "Anyone can view prizes" ON public.season_prizes
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage prizes" ON public.season_prizes
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Policies for user points
CREATE POLICY "Anyone can view season points" ON public.season_user_points
  FOR SELECT USING (true);

CREATE POLICY "System can manage season points" ON public.season_user_points
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for project scores
CREATE POLICY "Anyone can view project scores" ON public.season_project_scores
  FOR SELECT USING (true);

CREATE POLICY "System can manage project scores" ON public.season_project_scores
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for winners
CREATE POLICY "Anyone can view winners" ON public.season_winners
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage winners" ON public.season_winners
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Function to update season points when feedback is created
CREATE OR REPLACE FUNCTION public.update_season_points_on_feedback()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_season RECORD;
BEGIN
  -- Find all active seasons
  FOR active_season IN 
    SELECT id FROM seasons WHERE status = 'active' AND NOW() BETWEEN start_date AND end_date
  LOOP
    -- Upsert user points
    INSERT INTO season_user_points (season_id, user_id, points, feedback_count)
    VALUES (active_season.id, NEW.user_id, 5, 1)
    ON CONFLICT (season_id, user_id) 
    DO UPDATE SET 
      points = season_user_points.points + 5,
      feedback_count = season_user_points.feedback_count + 1,
      updated_at = NOW();
    
    -- Upsert project scores
    INSERT INTO season_project_scores (season_id, project_id, feedback_count, total_score)
    VALUES (active_season.id, NEW.project_id, 1, 10)
    ON CONFLICT (season_id, project_id)
    DO UPDATE SET
      feedback_count = season_project_scores.feedback_count + 1,
      total_score = season_project_scores.total_score + 10,
      updated_at = NOW();
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Function to update season points when feedback is resolved
CREATE OR REPLACE FUNCTION public.update_season_points_on_resolve()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_season RECORD;
BEGIN
  IF NEW.status = 'resolved' AND (OLD.status IS NULL OR OLD.status != 'resolved') THEN
    FOR active_season IN 
      SELECT id FROM seasons WHERE status = 'active' AND NOW() BETWEEN start_date AND end_date
    LOOP
      -- Add bonus points to user
      UPDATE season_user_points 
      SET points = points + 10,
          resolved_feedback_count = resolved_feedback_count + 1,
          updated_at = NOW()
      WHERE season_id = active_season.id AND user_id = NEW.user_id;
      
      -- Add bonus score to project
      UPDATE season_project_scores
      SET resolved_feedback_count = resolved_feedback_count + 1,
          total_score = total_score + 5,
          updated_at = NOW()
      WHERE season_id = active_season.id AND project_id = NEW.project_id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to update project scores when liked
CREATE OR REPLACE FUNCTION public.update_season_project_on_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_season RECORD;
BEGIN
  FOR active_season IN 
    SELECT id FROM seasons WHERE status = 'active' AND NOW() BETWEEN start_date AND end_date
  LOOP
    IF TG_OP = 'INSERT' THEN
      UPDATE season_project_scores
      SET likes_count = likes_count + 1,
          total_score = total_score + 2,
          updated_at = NOW()
      WHERE season_id = active_season.id AND project_id = NEW.project_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE season_project_scores
      SET likes_count = GREATEST(0, likes_count - 1),
          total_score = GREATEST(0, total_score - 2),
          updated_at = NOW()
      WHERE season_id = active_season.id AND project_id = OLD.project_id;
    END IF;
  END LOOP;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers
CREATE TRIGGER on_feedback_created_update_season
  AFTER INSERT ON public.project_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_season_points_on_feedback();

CREATE TRIGGER on_feedback_resolved_update_season
  AFTER UPDATE ON public.project_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_season_points_on_resolve();

CREATE TRIGGER on_project_like_update_season
  AFTER INSERT OR DELETE ON public.project_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_season_project_on_like();

-- Index for performance
CREATE INDEX idx_seasons_status ON public.seasons(status);
CREATE INDEX idx_seasons_dates ON public.seasons(start_date, end_date);
CREATE INDEX idx_season_user_points_ranking ON public.season_user_points(season_id, points DESC);
CREATE INDEX idx_season_project_scores_ranking ON public.season_project_scores(season_id, total_score DESC);