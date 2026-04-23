-- Add per-check-in privacy toggle to experiment_journal_entries
ALTER TABLE experiment_journal_entries
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;
