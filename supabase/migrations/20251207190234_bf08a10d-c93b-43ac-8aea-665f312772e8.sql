-- Add scheduling columns to broadcast_notifications
ALTER TABLE public.broadcast_notifications
ADD COLUMN scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN status TEXT NOT NULL DEFAULT 'sent',
ADD COLUMN level_filter TEXT DEFAULT NULL,
ADD COLUMN join_date_filter TEXT DEFAULT NULL;

-- Add index for finding pending scheduled notifications
CREATE INDEX idx_broadcast_scheduled ON public.broadcast_notifications (status, scheduled_at) 
WHERE status = 'scheduled';