-- Add community_id to courses table to allow community-specific courses
ALTER TABLE public.courses ADD COLUMN community_id uuid REFERENCES public.communities(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_courses_community_id ON public.courses(community_id);

-- RLS policy: Community owners can create courses for their community
CREATE POLICY "Owners can create courses for their community"
ON public.courses
FOR INSERT
WITH CHECK (
  community_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = courses.community_id
    AND community_members.user_id = auth.uid()
    AND community_members.is_owner = true
  )
);

-- RLS policy: Community owners can update their community courses
CREATE POLICY "Owners can update their community courses"
ON public.courses
FOR UPDATE
USING (
  community_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = courses.community_id
    AND community_members.user_id = auth.uid()
    AND community_members.is_owner = true
  )
);

-- RLS policy: Community owners can delete their community courses
CREATE POLICY "Owners can delete their community courses"
ON public.courses
FOR DELETE
USING (
  community_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = courses.community_id
    AND community_members.user_id = auth.uid()
    AND community_members.is_owner = true
  )
);

-- RLS policy: Community members can view community courses
CREATE POLICY "Community members can view community courses"
ON public.courses
FOR SELECT
USING (
  is_published = true AND (
    community_id IS NULL OR
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = courses.community_id
      AND community_members.user_id = auth.uid()
    )
  )
);

-- RLS policy: Owners can manage modules of their community courses
CREATE POLICY "Owners can manage community course modules"
ON public.course_modules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM courses c
    JOIN community_members cm ON cm.community_id = c.community_id
    WHERE c.id = course_modules.course_id
    AND cm.user_id = auth.uid()
    AND cm.is_owner = true
  )
);