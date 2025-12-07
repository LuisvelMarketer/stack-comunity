-- Allow owners to delete their scheduled notifications
CREATE POLICY "Owners can delete scheduled broadcasts"
ON public.broadcast_notifications
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = broadcast_notifications.community_id
    AND community_members.user_id = auth.uid()
    AND community_members.is_owner = true
  )
  AND status = 'scheduled'
);