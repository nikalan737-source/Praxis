-- 009_habits.sql
-- Habits system: track recurring protocols derived from theory action steps

CREATE TABLE IF NOT EXISTS habits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theory_id uuid REFERENCES theory_blocks(id) ON DELETE SET NULL,
  theory_title text,
  goal_category text,
  action_text text NOT NULL,
  frequency text NOT NULL DEFAULT 'daily',         -- 'daily' | 'weekly' | 'custom'
  scheduled_days text[] NOT NULL DEFAULT '{}',      -- ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  is_active boolean NOT NULL DEFAULT true,
  notion_id text,                                   -- future Notion integration
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own habits"
  ON habits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS habit_completions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_date date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(habit_id, completed_date)
);

ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own completions"
  ON habit_completions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for quick date-range queries (e.g. "show this week")
CREATE INDEX IF NOT EXISTS habit_completions_date_idx
  ON habit_completions(user_id, completed_date DESC);
