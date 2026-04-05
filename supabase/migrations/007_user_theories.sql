-- Label theories as user-created vs AI-generated
ALTER TABLE theory_blocks
  ADD COLUMN IF NOT EXISTS created_type text DEFAULT 'ai_generated'
    CHECK (created_type IN ('ai_generated', 'user_created'));

-- AI overview for user-created theories (AI cross-reference analysis)
ALTER TABLE theory_blocks
  ADD COLUMN IF NOT EXISTS ai_overview text;

-- Store the raw user theory text for reference
ALTER TABLE theory_blocks
  ADD COLUMN IF NOT EXISTS user_theory_text text;
