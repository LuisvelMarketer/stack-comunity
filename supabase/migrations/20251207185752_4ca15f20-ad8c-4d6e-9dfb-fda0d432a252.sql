-- Allow community owners to insert notifications for their community members
CREATE POLICY "Community owners can send notifications to members"
ON public.notifications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.user_id = auth.uid()
    AND cm.is_owner = true
    AND EXISTS (
      SELECT 1 FROM community_members target_member
      WHERE target_member.user_id = notifications.user_id
      AND target_member.community_id = cm.community_id
    )
  )
);