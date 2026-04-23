-- 017_experiment_logs_duration_days.sql
-- Store the planned protocol length directly on experiment_logs so day-count
-- displays ("Day {elapsed} / {duration}") can read a single source of truth
-- instead of joining through experiment_settings.
--
-- Default 56 (8 weeks) mirrors the mobile app's DEFAULT_DURATION_DAYS.

ALTER TABLE public.experiment_logs
  ADD COLUMN IF NOT EXISTS duration_days integer NOT NULL DEFAULT 56;

-- Backfill from experiment_settings.expected_duration_days where available.
UPDATE public.experiment_logs l
SET duration_days = s.expected_duration_days
FROM public.experiment_settings s
WHERE s.experiment_id = l.id
  AND s.expected_duration_days IS NOT NULL
  AND l.duration_days = 56;
