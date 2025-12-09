-- Drop the overly permissive profile search policy
DROP POLICY IF EXISTS "Authenticated users can search profiles for mentions" ON public.profiles;

-- Create a more restrictive policy that only allows viewing necessary fields
-- Users can view profiles of members in communities they belong to
CREATE POLICY "Users can view profiles of community members" 
ON public.profiles 
FOR SELECT 
USING (
  -- Can always view own profile
  auth.uid() = id
  OR
  -- Can view profiles of users in the same communities
  EXISTS (
    SELECT 1 FROM community_members cm1
    JOIN community_members cm2 ON cm1.community_id = cm2.community_id
    WHERE cm1.user_id = auth.uid()
    AND cm2.user_id = profiles.id
  )
);