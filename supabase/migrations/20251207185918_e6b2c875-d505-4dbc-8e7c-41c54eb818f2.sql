-- Create table for broadcast notification history
CREATE TABLE public.broadcast_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  recipients_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.broadcast_notifications ENABLE ROW LEVEL SECURITY;

-- Community owners can view their broadcast history
CREATE POLICY "Owners can view their broadcast history"
ON public.broadcast_notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = broadcast_notifications.community_id
    AND community_members.user_id = auth.uid()
    AND community_members.is_owner = true
  )
);

-- Community owners can insert broadcasts
CREATE POLICY "Owners can insert broadcasts"
ON public.broadcast_notifications
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = broadcast_notifications.community_id
    AND community_members.user_id = auth.uid()
    AND community_members.is_owner = true
  )
);