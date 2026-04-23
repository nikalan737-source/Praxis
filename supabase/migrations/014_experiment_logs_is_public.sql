-- Add privacy toggle to experiment_logs
ALTER TABLE experiment_logs ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;
