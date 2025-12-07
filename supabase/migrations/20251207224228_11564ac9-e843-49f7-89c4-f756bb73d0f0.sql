-- Create community gallery images table
CREATE TABLE public.community_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.community_gallery ENABLE ROW LEVEL SECURITY;

-- Anyone can view gallery images
CREATE POLICY "Anyone can view community gallery"
ON public.community_gallery
FOR SELECT
USING (true);

-- Owners can manage gallery
CREATE POLICY "Owners can manage community gallery"
ON public.community_gallery
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = community_gallery.community_id
    AND community_members.user_id = auth.uid()
    AND community_members.is_owner = true
  )
);

-- Create storage bucket for community gallery
INSERT INTO storage.buckets (id, name, public) 
VALUES ('community-gallery', 'community-gallery', true);

-- Storage policies
CREATE POLICY "Anyone can view gallery images"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-gallery');

CREATE POLICY "Owners can upload gallery images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'community-gallery' AND
  EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = (storage.foldername(name))[1]::uuid
    AND community_members.user_id = auth.uid()
    AND community_members.is_owner = true
  )
);

CREATE POLICY "Owners can delete gallery images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'community-gallery' AND
  EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = (storage.foldername(name))[1]::uuid
    AND community_members.user_id = auth.uid()
    AND community_members.is_owner = true
  )
);

-- Create index for faster queries
CREATE INDEX idx_community_gallery_community_id ON public.community_gallery(community_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_gallery;