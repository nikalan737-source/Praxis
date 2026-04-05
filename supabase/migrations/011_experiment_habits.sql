-- 011_experiment_habits.sql
-- Link habits to experiments for adherence tracking

-- ── Experiment-habit links ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS experiment_habit_links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  experiment_id uuid NOT NULL REFERENCES experiment_logs(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(experiment_id, habit_id)
);

ALTER TABLE experiment_habit_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own experiment habit links"
  ON experiment_habit_links FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Experiment habit check-ins (per journal entry) ──────────────────────────

CREATE TABLE IF NOT EXISTS experiment_habit_checkins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  experiment_id uuid NOT NULL REFERENCES experiment_logs(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  journal_entry_id uuid NOT NULL REFERENCES experiment_journal_entries(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(journal_entry_id, habit_id)
);

ALTER TABLE experiment_habit_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own experiment habit checkins"
  ON experiment_habit_checkins FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS exp_habit_checkins_experiment_idx
  ON experiment_habit_checkins(experiment_id);
