-- Add is_pinned column to community_messages
ALTER TABLE public.community_messages
ADD COLUMN is_pinned boolean DEFAULT false;

-- Add pinned_at timestamp
ALTER TABLE public.community_messages
ADD COLUMN pinned_at timestamp with time zone;

-- Add pinned_by to track who pinned the message
ALTER TABLE public.community_messages
ADD COLUMN pinned_by uuid REFERENCES auth.users(id);