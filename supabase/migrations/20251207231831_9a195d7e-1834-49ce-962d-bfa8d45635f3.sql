-- Add banner_url column to communities table
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS banner_url text;