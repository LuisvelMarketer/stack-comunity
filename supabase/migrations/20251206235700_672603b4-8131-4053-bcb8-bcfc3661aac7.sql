-- Add recurrence fields to events table
ALTER TABLE public.events
ADD COLUMN recurrence_type text DEFAULT NULL,
ADD COLUMN recurrence_end_date timestamp with time zone DEFAULT NULL,
ADD COLUMN parent_event_id uuid REFERENCES public.events(id) ON DELETE CASCADE DEFAULT NULL;

-- Create index for parent_event_id for better query performance
CREATE INDEX idx_events_parent_event_id ON public.events(parent_event_id);

-- Add comment explaining recurrence_type values
COMMENT ON COLUMN public.events.recurrence_type IS 'Values: daily, weekly, monthly, or null for non-recurring';