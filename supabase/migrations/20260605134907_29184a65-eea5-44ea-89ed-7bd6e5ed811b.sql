create table public.tm_match (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  created_by uuid references auth.users(id) on delete set null,
  red_fighter_id uuid not null references public.fighter_profiles(id),
  blue_fighter_id uuid not null references public.fighter_profiles(id),
  judge_fighter_id uuid not null references public.fighter_profiles(id),
  round_config int not null,
  round_duration_sec int not null,
  phase text not null default 'setup',
  winner_fighter_id uuid references public.fighter_profiles(id),
  result_type text,
  notes text,
  records_updated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tm_match_distinct_roles check (
    red_fighter_id <> blue_fighter_id
    and red_fighter_id <> judge_fighter_id
    and blue_fighter_id <> judge_fighter_id
  )
);

grant select, insert, update on public.tm_match to authenticated;
grant all on public.tm_match to service_role;
alter table public.tm_match enable row level security;

create policy "tm_match read" on public.tm_match for select to authenticated using (true);
create policy "tm_match insert by creator" on public.tm_match for insert to authenticated with check (auth.uid() = created_by);
create policy "tm_match update by creator" on public.tm_match for update to authenticated using (auth.uid() = created_by);

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create trigger tm_match_updated_at before update on public.tm_match
for each row execute function public.update_updated_at_column();

create or replace function public.tm_submit_verdict(
  _match_id uuid, _winner uuid, _result_type text, _notes text, _update_records boolean
) returns void language plpgsql security definer set search_path = public as $$
declare m public.tm_match%rowtype;
begin
  select * into m from public.tm_match where id = _match_id for update;
  if m.id is null then raise exception 'match not found'; end if;
  if m.records_updated then raise exception 'verdict already finalized'; end if;

  update public.tm_match set
    winner_fighter_id = _winner,
    result_type = _result_type,
    notes = _notes,
    records_updated = _update_records,
    phase = 'finished'
  where id = _match_id;

  if _update_records then
    if _result_type = 'draw' then
      update public.fighter_profiles set record_draws = coalesce(record_draws,0)+1
        where id in (m.red_fighter_id, m.blue_fighter_id);
    elsif _result_type = 'no_contest' then
      null;
    elsif _winner is not null then
      update public.fighter_profiles set record_wins = coalesce(record_wins,0)+1 where id = _winner;
      update public.fighter_profiles set record_losses = coalesce(record_losses,0)+1
        where id in (m.red_fighter_id, m.blue_fighter_id) and id <> _winner;
    end if;
  end if;
end $$;

grant execute on function public.tm_submit_verdict(uuid,uuid,text,text,boolean) to authenticated;

alter publication supabase_realtime add table public.tm_match;