begin;

create table if not exists public.v2_update_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  update_id uuid not null references public.v2_updates(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, update_id)
);

alter table public.v2_update_reads enable row level security;
drop policy if exists "Players manage their update reads" on public.v2_update_reads;
create policy "Players manage their update reads" on public.v2_update_reads
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.v2_update_reads to authenticated;

commit;
