-- Public RPC to fetch community check-ins for a theory (bypasses RLS)
-- Joins journal entries through experiment_logs, filtered by is_public = true
-- Returns per-check-in data including photos and adherence from the parent log
create or replace function public.get_community_results(target_theory_id uuid, result_limit int default 50)
returns table(
  user_email text,
  rating int,
  notes text,
  started_at timestamptz,
  entry_date date,
  days_in int,
  photo_urls text[],
  adherence_percent int,
  created_at timestamptz
) as $$
  select
    u.email::text,
    eje.rating,
    eje.notes,
    el.started_at,
    eje.entry_date,
    extract(day from eje.entry_date::timestamp - el.started_at::timestamp)::int,
    eje.photo_urls,
    el.adherence_percent,
    eje.created_at
  from public.experiment_journal_entries eje
  join public.experiment_logs el on el.id = eje.experiment_id
  join auth.users u on u.id = eje.user_id
  where el.theory_id = target_theory_id
    and eje.is_public = true
  order by eje.created_at desc
  limit result_limit;
$$ language sql security definer set search_path = public;
