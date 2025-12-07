-- Add 'owner' role to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';

-- Update community_members to track owner role
ALTER TABLE public.community_members 
ADD COLUMN IF NOT EXISTS is_owner boolean DEFAULT false;

-- Policy: Owners can update their community
CREATE POLICY "Owners can update their communities" 
ON public.communities 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM community_members 
    WHERE community_members.community_id = communities.id 
    AND community_members.user_id = auth.uid() 
    AND community_members.is_owner = true
  )
);

-- Policy: Owners can view all members of their community
CREATE POLICY "Owners can manage community members" 
ON public.community_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM community_members cm 
    WHERE cm.community_id = community_members.community_id 
    AND cm.user_id = auth.uid() 
    AND cm.is_owner = true
  )
);

-- Policy: Owners can create events in their community
CREATE POLICY "Owners can create events in their community" 
ON public.events 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM community_members 
    WHERE community_members.community_id = events.community_id 
    AND community_members.user_id = auth.uid() 
    AND community_members.is_owner = true
  )
);

-- Policy: Owners can update events in their community
CREATE POLICY "Owners can update events in their community" 
ON public.events 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM community_members 
    WHERE community_members.community_id = events.community_id 
    AND community_members.user_id = auth.uid() 
    AND community_members.is_owner = true
  )
);

-- Policy: Owners can delete events in their community
CREATE POLICY "Owners can delete events in their community" 
ON public.events 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM community_members 
    WHERE community_members.community_id = events.community_id 
    AND community_members.user_id = auth.uid() 
    AND community_members.is_owner = true
  )
);

-- Policy: Owners can create live sessions in their community
CREATE POLICY "Owners can create live sessions in their community" 
ON public.live_sessions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM community_members 
    WHERE community_members.community_id = live_sessions.community_id 
    AND community_members.user_id = auth.uid() 
    AND community_members.is_owner = true
  )
);

-- Policy: Owners can update live sessions in their community
CREATE POLICY "Owners can update live sessions in their community" 
ON public.live_sessions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM community_members 
    WHERE community_members.community_id = live_sessions.community_id 
    AND community_members.user_id = auth.uid() 
    AND community_members.is_owner = true
  )
);

-- Policy: Owners can delete live sessions in their community
CREATE POLICY "Owners can delete live sessions in their community" 
ON public.live_sessions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM community_members 
    WHERE community_members.community_id = live_sessions.community_id 
    AND community_members.user_id = auth.uid() 
    AND community_members.is_owner = true
  )
);