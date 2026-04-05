-- Add key_insight column to theory_blocks
ALTER TABLE theory_blocks
  ADD COLUMN IF NOT EXISTS key_insight text;
