-- Add bio, location and interests fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN bio TEXT,
ADD COLUMN location TEXT,
ADD COLUMN interests TEXT;