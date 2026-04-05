-- 010_experiment_journal.sql
-- Private experiment journaling system

-- ── Experiment settings (setup flow preferences) ─────────────────────────────

CREATE TABLE IF NOT EXISTS experiment_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  experiment_id uuid NOT NULL REFERENCES experiment_logs(id) ON DELETE CASCADE,
  tracking_types text[] NOT NULL DEFAULT '{}',        -- text, photos, measurements
  checkin_frequency text NOT NULL DEFAULT 'weekly',   -- weekly, biweekly, monthly, none
  tracking_categories text[] NOT NULL DEFAULT '{}',   -- Energy, Sleep, Mood, etc.
  primary_metric text,
  expected_duration_days integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(experiment_id)
);

ALTER TABLE experiment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own experiment settings"
  ON experiment_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Journal entries ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS experiment_journal_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  experiment_id uuid NOT NULL REFERENCES experiment_logs(id) ON DELETE CASCADE,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 10),
  notes text NOT NULL DEFAULT '',
  side_effects text,
  photo_urls text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE experiment_journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own journal entries"
  ON experiment_journal_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS journal_entries_experiment_idx
  ON experiment_journal_entries(experiment_id, entry_date DESC);

-- ── Private photo storage bucket ─────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-photos', 'journal-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Only owners can upload to their own folder (user_id/*)
CREATE POLICY "Users upload own journal photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'journal-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Only owners can view their own photos
CREATE POLICY "Users view own journal photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'journal-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Only owners can delete their own photos
CREATE POLICY "Users delete own journal photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'journal-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
