-- 012_habit_evidence_tier.sql
-- Add evidence tier to habits for science-strength markers

ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS evidence_tier text;
