-- theory_blocks: canonical store for theories (can be seeded from mock/generated)
create table if not exists public.theory_blocks (
  id text primary key,
  title text not null,
  goal_category text,
  goal_statement text,
  evidence_tier text,
  risk_level text,
  reversibility text,
  mechanism_summary text,
  interventions jsonb default '[]',
  tags jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- theory_upvotes: user upvotes, one per user per theory
create table if not exists public.theory_upvotes (
  id uuid primary key default gen_random_uuid(),
  theory_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(theory_id, user_id)
);

create index if not exists theory_upvotes_theory_id on public.theory_upvotes(theory_id);
create index if not exists theory_upvotes_user_id on public.theory_upvotes(user_id);

-- RLS
alter table public.theory_blocks enable row level security;
alter table public.theory_upvotes enable row level security;

-- theory_blocks: public read
create policy "theory_blocks_select" on public.theory_blocks for select using (true);

-- theory_upvotes: anyone can read (for counts), authenticated can insert/delete own
create policy "theory_upvotes_select" on public.theory_upvotes for select using (true);
create policy "theory_upvotes_insert" on public.theory_upvotes for insert with check (auth.uid() = user_id);
create policy "theory_upvotes_delete" on public.theory_upvotes for delete using (auth.uid() = user_id);
