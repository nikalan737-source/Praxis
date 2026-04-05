-- Track which evidence tiers were combined into a single published block
ALTER TABLE theory_blocks
  ADD COLUMN IF NOT EXISTS combined_tiers text[];

-- Concrete, immediately actionable steps derived from the theory
ALTER TABLE theory_blocks
  ADD COLUMN IF NOT EXISTS action_steps text[];
