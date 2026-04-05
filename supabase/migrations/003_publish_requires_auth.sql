-- Require auth for publishing theories (created_by must match current user)
drop policy if exists "theory_blocks_insert" on public.theory_blocks;
create policy "theory_blocks_insert" on public.theory_blocks
  for insert with check (auth.uid() is not null and auth.uid() = created_by);
