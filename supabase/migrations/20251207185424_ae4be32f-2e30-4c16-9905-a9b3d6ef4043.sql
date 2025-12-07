-- Create storage bucket for course files
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-files', 'course-files', true);

-- RLS policies for course files bucket
-- Community owners can upload files to their course modules
CREATE POLICY "Owners can upload course files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'course-files' AND
  EXISTS (
    SELECT 1 FROM course_modules cm
    JOIN courses c ON c.id = cm.course_id
    JOIN community_members mem ON mem.community_id = c.community_id
    WHERE mem.user_id = auth.uid()
    AND mem.is_owner = true
    AND (storage.foldername(name))[1] = cm.id::text
  )
);

-- Community owners can update their files
CREATE POLICY "Owners can update course files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'course-files' AND
  EXISTS (
    SELECT 1 FROM course_modules cm
    JOIN courses c ON c.id = cm.course_id
    JOIN community_members mem ON mem.community_id = c.community_id
    WHERE mem.user_id = auth.uid()
    AND mem.is_owner = true
    AND (storage.foldername(name))[1] = cm.id::text
  )
);

-- Community owners can delete their files
CREATE POLICY "Owners can delete course files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'course-files' AND
  EXISTS (
    SELECT 1 FROM course_modules cm
    JOIN courses c ON c.id = cm.course_id
    JOIN community_members mem ON mem.community_id = c.community_id
    WHERE mem.user_id = auth.uid()
    AND mem.is_owner = true
    AND (storage.foldername(name))[1] = cm.id::text
  )
);

-- Anyone can view course files (public bucket)
CREATE POLICY "Anyone can view course files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'course-files');

-- Create table for module attachments
CREATE TABLE public.module_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  file_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.module_attachments ENABLE ROW LEVEL SECURITY;

-- Anyone can view attachments of published courses
CREATE POLICY "Anyone can view module attachments"
ON public.module_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM course_modules cm
    JOIN courses c ON c.id = cm.course_id
    WHERE cm.id = module_attachments.module_id
    AND c.is_published = true
  )
);

-- Community owners can manage attachments
CREATE POLICY "Owners can insert module attachments"
ON public.module_attachments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM course_modules cm
    JOIN courses c ON c.id = cm.course_id
    JOIN community_members mem ON mem.community_id = c.community_id
    WHERE cm.id = module_attachments.module_id
    AND mem.user_id = auth.uid()
    AND mem.is_owner = true
  )
);

CREATE POLICY "Owners can delete module attachments"
ON public.module_attachments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM course_modules cm
    JOIN courses c ON c.id = cm.course_id
    JOIN community_members mem ON mem.community_id = c.community_id
    WHERE cm.id = module_attachments.module_id
    AND mem.user_id = auth.uid()
    AND mem.is_owner = true
  )
);

-- Create index for better performance
CREATE INDEX idx_module_attachments_module_id ON public.module_attachments(module_id);