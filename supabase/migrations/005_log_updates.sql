-- log_updates: dated progress entries on an existing experiment log
create table if not exists public.log_updates (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references public.experiment_logs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  notes text not null default '',
  adherence_percent int,
  outcome_rating int,
  side_effects text default '',
  created_at timestamptz default now()
);

alter table public.log_updates enable row level security;

-- owner can always see their own updates
create policy "log_updates_select_own" on public.log_updates for select using (auth.uid() = user_id);
-- public log updates are readable by everyone
create policy "log_updates_select_public" on public.log_updates
  for select using (
    exists (
      select 1 from public.experiment_logs el
      where el.id = log_id and el.is_public = true
    )
  );
create policy "log_updates_insert" on public.log_updates for insert with check (auth.uid() = user_id);
create policy "log_updates_delete" on public.log_updates for delete using (auth.uid() = user_id);

create index if not exists log_updates_log_id on public.log_updates(log_id);
create index if not exists log_updates_user_id on public.log_updates(user_id);
