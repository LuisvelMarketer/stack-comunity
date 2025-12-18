-- Create code_snippets table
CREATE TABLE public.code_snippets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'code' CHECK (type IN ('code', 'prompt', 'template')),
  language TEXT DEFAULT 'javascript',
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create code_snippet_favorites table
CREATE TABLE public.code_snippet_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  snippet_id UUID NOT NULL REFERENCES public.code_snippets(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, snippet_id)
);

-- Create indexes
CREATE INDEX idx_code_snippets_community ON public.code_snippets(community_id);
CREATE INDEX idx_code_snippets_type ON public.code_snippets(type);
CREATE INDEX idx_code_snippets_language ON public.code_snippets(language);
CREATE INDEX idx_code_snippets_tags ON public.code_snippets USING GIN(tags);
CREATE INDEX idx_code_snippet_favorites_user ON public.code_snippet_favorites(user_id);

-- Enable RLS
ALTER TABLE public.code_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_snippet_favorites ENABLE ROW LEVEL SECURITY;

-- RLS policies for code_snippets
CREATE POLICY "Anyone can view public snippets"
  ON public.code_snippets FOR SELECT
  USING (is_public = true);

CREATE POLICY "Community members can view community snippets"
  ON public.code_snippets FOR SELECT
  USING (
    community_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = code_snippets.community_id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all snippets"
  ON public.code_snippets FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Community owners can manage community snippets"
  ON public.code_snippets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = code_snippets.community_id
      AND community_members.user_id = auth.uid()
      AND community_members.is_owner = true
    )
  );

-- RLS policies for code_snippet_favorites
CREATE POLICY "Users can view own favorites"
  ON public.code_snippet_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own favorites"
  ON public.code_snippet_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON public.code_snippet_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_code_snippets_updated_at
  BEFORE UPDATE ON public.code_snippets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for snippets
ALTER PUBLICATION supabase_realtime ADD TABLE public.code_snippets;