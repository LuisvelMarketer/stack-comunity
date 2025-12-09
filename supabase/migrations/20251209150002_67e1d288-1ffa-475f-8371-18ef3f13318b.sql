-- Drop the existing policy that allows any authenticated user to create communities
DROP POLICY IF EXISTS "Authenticated users can create communities" ON communities;

-- Create new policy that only allows admins to create communities
CREATE POLICY "Only admins can create communities"
ON communities FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));