-- Add column for multiple screenshots (array of URLs)
ALTER TABLE public.project_feedback 
ADD COLUMN IF NOT EXISTS screenshot_urls text[] DEFAULT '{}';

-- Migrate existing screenshot_url data to new array column
UPDATE public.project_feedback 
SET screenshot_urls = ARRAY[screenshot_url] 
WHERE screenshot_url IS NOT NULL AND (screenshot_urls IS NULL OR screenshot_urls = '{}');