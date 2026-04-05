-- Drop old tables (from 001)
drop table if exists public.theory_upvotes;
drop table if exists public.theory_blocks;

-- theory_blocks
create table public.theory_blocks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  goal_category text,
  goal_statement text,
  evidence_tier text,
  risk_level text,
  reversibility text,
  mechanism_summary text,
  interventions jsonb default '[]',
  tags text[] default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- theory_saves
create table public.theory_saves (
  id uuid primary key default gen_random_uuid(),
  theory_id uuid not null references public.theory_blocks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(theory_id, user_id)
);

-- theory_upvotes
create table public.theory_upvotes (
  id uuid primary key default gen_random_uuid(),
  theory_id uuid not null references public.theory_blocks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(theory_id, user_id)
);

-- experiment_logs
create table public.experiment_logs (
  id uuid primary key default gen_random_uuid(),
  theory_id uuid not null references public.theory_blocks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz,
  ended_at timestamptz,
  adherence_percent int,
  followed_interventions text[] default '{}',
  skipped_interventions text[] default '{}',
  outcome_rating int,
  notes text,
  side_effects text,
  created_at timestamptz default now()
);

create index theory_saves_theory_id on public.theory_saves(theory_id);
create index theory_saves_user_id on public.theory_saves(user_id);
create index theory_upvotes_theory_id on public.theory_upvotes(theory_id);
create index theory_upvotes_user_id on public.theory_upvotes(user_id);
create index experiment_logs_theory_id on public.experiment_logs(theory_id);
create index experiment_logs_user_id on public.experiment_logs(user_id);

-- RLS
alter table public.theory_blocks enable row level security;
alter table public.theory_saves enable row level security;
alter table public.theory_upvotes enable row level security;
alter table public.experiment_logs enable row level security;

create policy "theory_blocks_select" on public.theory_blocks for select using (true);
create policy "theory_blocks_insert" on public.theory_blocks for insert with check (true);
create policy "theory_blocks_update" on public.theory_blocks for update using (true);

create policy "theory_saves_select" on public.theory_saves for select using (true);
create policy "theory_saves_insert" on public.theory_saves for insert with check (auth.uid() = user_id);
create policy "theory_saves_delete" on public.theory_saves for delete using (auth.uid() = user_id);

create policy "theory_upvotes_select" on public.theory_upvotes for select using (true);
create policy "theory_upvotes_insert" on public.theory_upvotes for insert with check (auth.uid() = user_id);
create policy "theory_upvotes_delete" on public.theory_upvotes for delete using (auth.uid() = user_id);

create policy "experiment_logs_select_own" on public.experiment_logs for select using (auth.uid() = user_id);
create policy "experiment_logs_insert" on public.experiment_logs for insert with check (auth.uid() = user_id);
create policy "experiment_logs_delete" on public.experiment_logs for delete using (auth.uid() = user_id);

-- Function for public aggregate stats (bypasses RLS for counts)
create or replace function public.get_experiment_log_stats(theory_ids uuid[])
returns table(theory_id uuid, log_count bigint, avg_outcome float) as $$
  select el.theory_id, count(*)::bigint, round(avg(el.outcome_rating)::numeric, 1)::float
  from public.experiment_logs el
  where el.theory_id = any(theory_ids)
  group by el.theory_id;
$$ language sql security definer set search_path = public;

-- Seed 8 theory blocks (deterministic UUIDs via gen_random_uuid for new rows)
-- Using md5 to generate deterministic UUIDs from slug
insert into public.theory_blocks (id, title, goal_category, goal_statement, evidence_tier, risk_level, reversibility, mechanism_summary, interventions, tags) values
  ('a0000001-0001-5000-8000-000000000001'::uuid, 'Sleep extension for cognitive performance', 'Cognitive', 'Improve focus and reaction time by extending sleep to 7.5–8h.', 'Strong', 'Low', 'High', 'Sleep consolidates memory and clears metabolic waste; adequate duration improves prefrontal function.', '[{"tier":"Strong","name":"Fixed wake time + wind-down","mechanism":"Stabilize circadian phase and reduce sleep latency.","steps":["Set alarm 7.5h after target bedtime","No screens 1h before bed","Dim lights 2h before"],"durationDays":14,"trackingMetrics":["Sleep duration","Sleep onset latency","Subjective alertness"],"expectedMagnitude":"Medium","riskLevel":"Low","reversibility":"High","contraindications":[]}]'::jsonb, array['sleep','cognition','performance']),
  ('a0000001-0001-5000-8000-000000000002'::uuid, 'Morning light for mood and energy', 'Mood', 'Reduce low mood and increase morning energy with 20min outdoor light.', 'Strong', 'Low', 'High', 'Bright light suppresses melatonin and phase-advances circadian rhythm; supports serotonin and alertness.', '[{"tier":"Strong","name":"Morning light exposure","mechanism":"Phase advance and melatonin suppression.","steps":["Within 1h of wake, get 20min outdoors or 10k lux lamp","Avoid bright light late evening"],"durationDays":7,"trackingMetrics":["Mood 1–10","Energy 1–10","Sleep quality"],"expectedMagnitude":"Medium","riskLevel":"Low","reversibility":"High","contraindications":["Bipolar disorder","Photosensitivity"]}]'::jsonb, array['light','mood','circadian']),
  ('a0000001-0001-5000-8000-000000000003'::uuid, 'Zone 2 cardio for metabolic health', 'Metabolic', 'Improve insulin sensitivity and fat oxidation with 3×30min zone 2 per week.', 'Strong', 'Low', 'High', 'Low-intensity aerobic work increases mitochondrial density and fatty acid oxidation; improves insulin signaling.', '[{"tier":"Strong","name":"Zone 2 protocol","mechanism":"Mitochondrial adaptation and metabolic flexibility.","steps":["Warm up 5min","30min at ~60–70% max HR or conversational pace","Cool down 5min"],"durationDays":84,"trackingMetrics":["Fasting glucose","Resting HR","RPE"],"expectedMagnitude":"Medium","riskLevel":"Low","reversibility":"High","contraindications":["Unstable cardiovascular disease"]}]'::jsonb, array['cardio','metabolic','zone2']),
  ('a0000001-0001-5000-8000-000000000004'::uuid, 'Resistance training for strength', 'Physical', 'Increase strength and lean mass with 2× full-body resistance per week.', 'Strong', 'Moderate', 'Medium', 'Progressive overload and recovery drive hypertrophy and neuromuscular adaptation.', '[{"tier":"Strong","name":"Full-body strength","mechanism":"Mechanical tension and metabolic stress.","steps":["Compound lifts 3×8–12","Progressive overload weekly","48h between sessions"],"durationDays":56,"trackingMetrics":["Lift loads","Body weight","Soreness"],"expectedMagnitude":"Medium","riskLevel":"Moderate","reversibility":"Medium","contraindications":["Acute injury","Uncontrolled hypertension"]}]'::jsonb, array['strength','hypertrophy','resistance']),
  ('a0000001-0001-5000-8000-000000000005'::uuid, 'Cold exposure for resilience', 'Recovery', 'Improve stress resilience and recovery with short cold exposure.', 'Emerging', 'Moderate', 'High', 'Cold activates sympathetic and norepinephrine response; may support mood and recovery signaling.', '[{"tier":"Emerging","name":"Cold shower / immersion","mechanism":"Sympathetic activation and possible anti-inflammatory effects.","steps":["End shower with 1–3min cold","Or 2–5min immersion to shoulders"],"durationDays":14,"trackingMetrics":["HRV","Mood","Perceived recovery"],"expectedMagnitude":"Small","riskLevel":"Moderate","reversibility":"High","contraindications":["Cardiovascular disease","Raynaud''s","Pregnancy"]}]'::jsonb, array['cold','recovery','stress']),
  ('a0000001-0001-5000-8000-000000000006'::uuid, 'Intermittent fasting for body composition', 'Metabolic', 'Support fat loss and metabolic flexibility with 16:8 fasting.', 'Emerging', 'Low', 'High', 'Extended fasting window may enhance fat oxidation and autophagy; evidence mixed for superior fat loss vs. calorie match.', '[{"tier":"Emerging","name":"16:8 daily fasting","mechanism":"Extended low-insulin window and possible autophagy.","steps":["Eat within 8h window","Hydrate in fast","Prioritize protein in eating window"],"durationDays":28,"trackingMetrics":["Weight","Energy","Hunger"],"expectedMagnitude":"Small","riskLevel":"Low","reversibility":"High","contraindications":["Eating disorders","Diabetes on meds","Pregnancy"]}]'::jsonb, array['fasting','metabolic','body-composition']),
  ('a0000001-0001-5000-8000-000000000007'::uuid, 'Nootropic stack for focus', 'Cognitive', 'Enhance sustained focus with caffeine + L-theanine.', 'Emerging', 'Low', 'High', 'Caffeine antagonizes adenosine; L-theanine may smooth stimulation and reduce jitter.', '[{"tier":"Emerging","name":"Caffeine + L-theanine","mechanism":"Adenosine antagonism with modulated arousal.","steps":["~100mg caffeine + 200mg L-theanine","Take in morning or before deep work"],"durationDays":7,"trackingMetrics":["Focus self-report","HR","Sleep that night"],"expectedMagnitude":"Small","riskLevel":"Low","reversibility":"High","contraindications":["Anxiety disorders","Heart conditions","Pregnancy"]}]'::jsonb, array['nootropics','focus','cognition']),
  ('a0000001-0001-5000-8000-000000000008'::uuid, 'Sauna for cardiovascular and mood', 'Recovery', 'Support cardiovascular and mood with 2×20min sauna per week.', 'Theoretical', 'Moderate', 'High', 'Heat stress may induce heat-shock proteins and improve endothelial function; observational links to cardiovascular and mood.', '[{"tier":"Theoretical","name":"Sauna protocol","mechanism":"Heat shock response and possible endothelial adaptation.","steps":["2×20min at 80–90°C","Cool down between rounds","Hydrate well"],"durationDays":56,"trackingMetrics":["Resting HR","Mood","Recovery"],"expectedMagnitude":"Small","riskLevel":"Moderate","reversibility":"High","contraindications":["Unstable cardiovascular","Pregnancy","Certain medications"]}]'::jsonb, array['sauna','recovery','cardiovascular']);
