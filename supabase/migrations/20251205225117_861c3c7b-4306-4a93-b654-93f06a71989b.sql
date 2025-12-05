-- Add reply_to_id column for message threads
ALTER TABLE public.community_messages
ADD COLUMN reply_to_id uuid REFERENCES public.community_messages(id) ON DELETE SET NULL;