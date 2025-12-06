-- Allow admins to delete events
CREATE POLICY "Admins can delete events"
ON public.events
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update any event
CREATE POLICY "Admins can update any event"
ON public.events
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to create events in any community
CREATE POLICY "Admins can create events"
ON public.events
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));