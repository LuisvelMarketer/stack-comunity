-- Create build_projects table for student projects
CREATE TABLE public.build_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  repository_url TEXT,
  live_url TEXT,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('idea', 'in_progress', 'paused', 'completed', 'abandoned')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'community', 'private')),
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  is_featured BOOLEAN DEFAULT false,
  featured_at TIMESTAMP WITH TIME ZONE,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_updates table for journal entries
CREATE TABLE public.project_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.build_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  update_type TEXT NOT NULL DEFAULT 'progress' CHECK (update_type IN ('progress', 'milestone', 'challenge', 'learning', 'launch')),
  mood TEXT CHECK (mood IN ('excited', 'productive', 'stuck', 'learning', 'celebrating')),
  hours_spent INTEGER,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_feedback table for comments
CREATE TABLE public.project_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.build_projects(id) ON DELETE CASCADE,
  update_id UUID REFERENCES public.project_updates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  feedback_type TEXT DEFAULT 'comment' CHECK (feedback_type IN ('comment', 'suggestion', 'encouragement', 'question')),
  parent_id UUID REFERENCES public.project_feedback(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_likes table
CREATE TABLE public.project_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.build_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create project_followers table to follow projects
CREATE TABLE public.project_followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.build_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.build_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for build_projects
CREATE POLICY "Anyone can view public projects"
ON public.build_projects FOR SELECT
USING (visibility = 'public');

CREATE POLICY "Community members can view community projects"
ON public.build_projects FOR SELECT
USING (
  visibility = 'community' AND
  EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = build_projects.community_id
    AND community_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view own projects"
ON public.build_projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
ON public.build_projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
ON public.build_projects FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
ON public.build_projects FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for project_updates
CREATE POLICY "Anyone can view updates of visible projects"
ON public.project_updates FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM build_projects
    WHERE build_projects.id = project_updates.project_id
    AND (
      build_projects.visibility = 'public'
      OR build_projects.user_id = auth.uid()
      OR (
        build_projects.visibility = 'community' AND
        EXISTS (
          SELECT 1 FROM community_members
          WHERE community_members.community_id = build_projects.community_id
          AND community_members.user_id = auth.uid()
        )
      )
    )
  )
);

CREATE POLICY "Project owners can create updates"
ON public.project_updates FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM build_projects
    WHERE build_projects.id = project_updates.project_id
    AND build_projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own entries"
ON public.project_updates FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries"
ON public.project_updates FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for project_feedback
CREATE POLICY "Anyone can view feedback on visible projects"
ON public.project_feedback FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM build_projects
    WHERE build_projects.id = project_feedback.project_id
    AND (
      build_projects.visibility = 'public'
      OR build_projects.user_id = auth.uid()
      OR (
        build_projects.visibility = 'community' AND
        EXISTS (
          SELECT 1 FROM community_members
          WHERE community_members.community_id = build_projects.community_id
          AND community_members.user_id = auth.uid()
        )
      )
    )
  )
);

CREATE POLICY "Authenticated users can add feedback"
ON public.project_feedback FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM build_projects
    WHERE build_projects.id = project_feedback.project_id
    AND (
      build_projects.visibility = 'public'
      OR build_projects.user_id = auth.uid()
      OR (
        build_projects.visibility = 'community' AND
        EXISTS (
          SELECT 1 FROM community_members
          WHERE community_members.community_id = build_projects.community_id
          AND community_members.user_id = auth.uid()
        )
      )
    )
  )
);

CREATE POLICY "Users can delete own feedback"
ON public.project_feedback FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for project_likes
CREATE POLICY "Anyone can view likes"
ON public.project_likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like projects"
ON public.project_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own likes"
ON public.project_likes FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for project_followers
CREATE POLICY "Anyone can view followers"
ON public.project_followers FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can follow projects"
ON public.project_followers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow"
ON public.project_followers FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to update likes_count
CREATE OR REPLACE FUNCTION public.update_project_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE build_projects SET likes_count = likes_count + 1 WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE build_projects SET likes_count = likes_count - 1 WHERE id = OLD.project_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_project_like_change
AFTER INSERT OR DELETE ON public.project_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_project_likes_count();

-- Trigger to update updated_at
CREATE TRIGGER update_build_projects_updated_at
BEFORE UPDATE ON public.build_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_updates_updated_at
BEFORE UPDATE ON public.project_updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_build_projects_user_id ON public.build_projects(user_id);
CREATE INDEX idx_build_projects_visibility ON public.build_projects(visibility);
CREATE INDEX idx_build_projects_status ON public.build_projects(status);
CREATE INDEX idx_build_projects_featured ON public.build_projects(is_featured) WHERE is_featured = true;
CREATE INDEX idx_project_updates_project_id ON public.project_updates(project_id);
CREATE INDEX idx_project_feedback_project_id ON public.project_feedback(project_id);

-- Enable realtime for updates feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_feedback;