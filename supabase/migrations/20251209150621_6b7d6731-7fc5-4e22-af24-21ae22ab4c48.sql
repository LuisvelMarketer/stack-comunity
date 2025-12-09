-- Drop existing UPDATE/DELETE policies if any
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;

-- Users can update their own profile only
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can delete their own profile (account)
CREATE POLICY "Users can delete own profile"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Admins can delete any profile (problematic users)
CREATE POLICY "Admins can delete any profile"
ON profiles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));