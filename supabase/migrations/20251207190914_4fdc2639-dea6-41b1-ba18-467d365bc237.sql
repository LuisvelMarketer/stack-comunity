-- Create table for notification templates
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Owners can view their templates
CREATE POLICY "Owners can view their templates"
ON public.notification_templates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = notification_templates.community_id
    AND community_members.user_id = auth.uid()
    AND community_members.is_owner = true
  )
);

-- Owners can create templates
CREATE POLICY "Owners can create templates"
ON public.notification_templates
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = notification_templates.community_id
    AND community_members.user_id = auth.uid()
    AND community_members.is_owner = true
  )
);

-- Owners can delete templates
CREATE POLICY "Owners can delete templates"
ON public.notification_templates
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = notification_templates.community_id
    AND community_members.user_id = auth.uid()
    AND community_members.is_owner = true
  )
);