-- Create module_comments table
CREATE TABLE public.module_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.module_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_edited BOOLEAN DEFAULT false,
  CONSTRAINT content_min_length CHECK (char_length(content) >= 1)
);

-- Create index for faster queries
CREATE INDEX idx_module_comments_module_id ON public.module_comments(module_id);
CREATE INDEX idx_module_comments_parent_id ON public.module_comments(parent_comment_id);
CREATE INDEX idx_module_comments_user_id ON public.module_comments(user_id);

-- Enable RLS
ALTER TABLE public.module_comments ENABLE ROW LEVEL SECURITY;

-- Policies for module_comments
CREATE POLICY "Users can view comments of published courses"
  ON public.module_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_modules cm
      JOIN courses c ON c.id = cm.course_id
      WHERE cm.id = module_comments.module_id
      AND c.is_published = true
    )
  );

CREATE POLICY "Authenticated users can create comments"
  ON public.module_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM course_modules cm
      JOIN courses c ON c.id = cm.course_id
      WHERE cm.id = module_comments.module_id
      AND c.is_published = true
    )
  );

CREATE POLICY "Users can update own comments"
  ON public.module_comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.module_comments
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any comment"
  ON public.module_comments
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_module_comments_updated_at
  BEFORE UPDATE ON public.module_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();