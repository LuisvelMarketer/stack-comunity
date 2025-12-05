-- Add policy to allow authenticated users to search profiles by name
-- This is needed for the mention autocomplete feature
CREATE POLICY "Authenticated users can search profiles for mentions" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Drop the old restrictive policy that only allows viewing own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;