-- Drop existing foreign keys and recreate with profiles
ALTER TABLE public.posts DROP CONSTRAINT posts_user_id_fkey;
ALTER TABLE public.post_likes DROP CONSTRAINT post_likes_user_id_fkey;
ALTER TABLE public.post_comments DROP CONSTRAINT post_comments_user_id_fkey;

-- Add new foreign keys pointing to profiles
ALTER TABLE public.posts
ADD CONSTRAINT posts_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.post_likes
ADD CONSTRAINT post_likes_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.post_comments
ADD CONSTRAINT post_comments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;