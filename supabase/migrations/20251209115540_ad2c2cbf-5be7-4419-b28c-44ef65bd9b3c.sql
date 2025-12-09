
-- Add screenshot_url column to project_feedback
ALTER TABLE public.project_feedback 
ADD COLUMN IF NOT EXISTS screenshot_url text;

-- Create storage bucket for feedback screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-screenshots', 'feedback-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for feedback-screenshots bucket
CREATE POLICY "Anyone can view feedback screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'feedback-screenshots');

CREATE POLICY "Authenticated users can upload feedback screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'feedback-screenshots' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own feedback screenshots"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'feedback-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
