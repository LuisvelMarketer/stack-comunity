-- Add column for screen recording URL
ALTER TABLE public.project_feedback 
ADD COLUMN IF NOT EXISTS video_url text;

-- Create storage bucket for feedback videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('feedback-videos', 'feedback-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public viewing of feedback videos
CREATE POLICY "Anyone can view feedback videos" ON storage.objects
FOR SELECT USING (bucket_id = 'feedback-videos');

-- Allow authenticated users to upload feedback videos
CREATE POLICY "Authenticated users can upload feedback videos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'feedback-videos' AND auth.uid() IS NOT NULL);

-- Allow users to delete their own feedback videos
CREATE POLICY "Users can delete own feedback videos" ON storage.objects
FOR DELETE USING (bucket_id = 'feedback-videos' AND auth.uid()::text = (storage.foldername(name))[1]);