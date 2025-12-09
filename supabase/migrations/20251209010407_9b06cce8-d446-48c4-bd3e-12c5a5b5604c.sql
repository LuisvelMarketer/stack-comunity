
-- Create table for AI mentor suggestions
CREATE TABLE public.ai_mentor_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.course_modules(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL DEFAULT 'general', -- 'blocked', 'encouragement', 'tip', 'milestone'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create table for tracking user activity patterns
CREATE TABLE public.user_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- 'module_view', 'quiz_attempt', 'lesson_complete', 'login'
  module_id UUID REFERENCES public.course_modules(id) ON DELETE SET NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_mentor_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_mentor_suggestions
CREATE POLICY "Users can view own suggestions"
  ON public.ai_mentor_suggestions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own suggestions"
  ON public.ai_mentor_suggestions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage suggestions"
  ON public.ai_mentor_suggestions FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for user_activity_logs
CREATE POLICY "Users can view own activity"
  ON public.user_activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
  ON public.user_activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage activity logs"
  ON public.user_activity_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_ai_mentor_suggestions_user ON public.ai_mentor_suggestions(user_id);
CREATE INDEX idx_ai_mentor_suggestions_unread ON public.ai_mentor_suggestions(user_id, is_read, is_dismissed);
CREATE INDEX idx_user_activity_logs_user ON public.user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_created ON public.user_activity_logs(created_at DESC);
