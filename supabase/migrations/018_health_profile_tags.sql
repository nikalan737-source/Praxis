-- User health context tags for personalization (theory generation, etc.)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS health_tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS health_profile_onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Accounts that already existed before this feature should not see first-login onboarding
UPDATE public.profiles
SET health_profile_onboarding_completed = true
WHERE health_profile_onboarding_completed = false;
