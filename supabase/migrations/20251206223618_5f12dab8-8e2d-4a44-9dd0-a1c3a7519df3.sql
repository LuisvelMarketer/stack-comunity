-- Create live_sessions table for storing live stream events
CREATE TABLE public.live_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL DEFAULT 'youtube', -- youtube, zoom, other
  stream_url TEXT NOT NULL,
  thumbnail_url TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, live, ended, cancelled
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can view live sessions from communities they're members of
CREATE POLICY "Community members can view live sessions" 
ON public.live_sessions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE community_members.community_id = live_sessions.community_id 
    AND community_members.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.communities 
    WHERE communities.id = live_sessions.community_id
  )
);

-- Only admins can create live sessions
CREATE POLICY "Admins can create live sessions" 
ON public.live_sessions FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update live sessions
CREATE POLICY "Admins can update live sessions" 
ON public.live_sessions FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete live sessions
CREATE POLICY "Admins can delete live sessions" 
ON public.live_sessions FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_live_sessions_community ON public.live_sessions(community_id);
CREATE INDEX idx_live_sessions_status ON public.live_sessions(status);
CREATE INDEX idx_live_sessions_scheduled ON public.live_sessions(scheduled_at);