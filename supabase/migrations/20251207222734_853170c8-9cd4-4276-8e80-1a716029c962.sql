-- Add category and tags columns to communities table
ALTER TABLE public.communities 
ADD COLUMN IF NOT EXISTS category text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create index for faster category filtering
CREATE INDEX IF NOT EXISTS idx_communities_category ON public.communities(category);

-- Create GIN index for tags array search
CREATE INDEX IF NOT EXISTS idx_communities_tags ON public.communities USING GIN(tags);