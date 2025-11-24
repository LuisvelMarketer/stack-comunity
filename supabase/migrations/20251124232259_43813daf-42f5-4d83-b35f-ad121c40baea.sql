-- Add onboarding_completed field to profiles table
ALTER TABLE public.profiles
ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;

-- Update existing users to have onboarding completed
UPDATE public.profiles
SET onboarding_completed = true;