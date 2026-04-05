-- Add new fields to experiment_logs
alter table public.experiment_logs
  add column if not exists status text not null default 'in_progress',
  add column if not exists is_public boolean not null default false,
  add column if not exists updated_at timestamptz default now();

-- Change started_at / ended_at to date (table is empty so safe to do)
alter table public.experiment_logs
  alter column started_at type date using started_at::date,
  alter column ended_at type date using ended_at::date;

-- Allow users to update their own logs
create policy "experiment_logs_update" on public.experiment_logs
  for update using (auth.uid() = user_id);

-- Public logs are readable by everyone
create policy "experiment_logs_select_public" on public.experiment_logs
  for select using (is_public = true);

-- log_endorsements: users can endorse public logs
create table if not exists public.log_endorsements (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references public.experiment_logs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(log_id, user_id)
);

alter table public.log_endorsements enable row level security;
create policy "log_endorsements_select" on public.log_endorsements for select using (true);
create policy "log_endorsements_insert" on public.log_endorsements for insert with check (auth.uid() = user_id);
create policy "log_endorsements_delete" on public.log_endorsements for delete using (auth.uid() = user_id);

create index if not exists log_endorsements_log_id on public.log_endorsements(log_id);
create index if not exists log_endorsements_user_id on public.log_endorsements(user_id);

-- log_comments: signed-in users can comment on public logs
create table if not exists public.log_comments (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references public.experiment_logs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.log_comments enable row level security;
create policy "log_comments_select" on public.log_comments for select using (true);
create policy "log_comments_insert" on public.log_comments for insert with check (auth.uid() = user_id);
create policy "log_comments_delete" on public.log_comments for delete using (auth.uid() = user_id);

create index if not exists log_comments_log_id on public.log_comments(log_id);

-- comment_endorsements: users can endorse comments
create table if not exists public.comment_endorsements (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.log_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(comment_id, user_id)
);

alter table public.comment_endorsements enable row level security;
create policy "comment_endorsements_select" on public.comment_endorsements for select using (true);
create policy "comment_endorsements_insert" on public.comment_endorsements for insert with check (auth.uid() = user_id);
create policy "comment_endorsements_delete" on public.comment_endorsements for delete using (auth.uid() = user_id);

create index if not exists comment_endorsements_comment_id on public.comment_endorsements(comment_id);
create index if not exists comment_endorsements_user_id on public.comment_endorsements(user_id);
