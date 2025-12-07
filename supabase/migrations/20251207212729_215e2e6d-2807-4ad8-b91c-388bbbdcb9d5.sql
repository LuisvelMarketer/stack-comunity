-- Fix infinite recursion in community_members RLS policy
-- The "Owners can manage community members" policy with ALL command causes recursion
-- because it references community_members while checking SELECT permissions

-- Drop the problematic policy
DROP POLICY IF EXISTS "Owners can manage community members" ON public.community_members;

-- Create separate policies for INSERT, UPDATE, DELETE (not SELECT, which is already covered)
CREATE POLICY "Owners can insert community members"
ON public.community_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = community_members.community_id
    AND cm.user_id = auth.uid()
    AND cm.is_owner = true
  )
);

CREATE POLICY "Owners can update community members"
ON public.community_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = community_members.community_id
    AND cm.user_id = auth.uid()
    AND cm.is_owner = true
  )
);

CREATE POLICY "Owners can delete community members"
ON public.community_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = community_members.community_id
    AND cm.user_id = auth.uid()
    AND cm.is_owner = true
  )
);