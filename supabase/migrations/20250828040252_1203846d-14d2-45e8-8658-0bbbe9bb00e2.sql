-- =========================================================
-- BDG – MIGRACIÓN SQL INICIAL
-- Esquema flexible para votaciones en vivo multi-disciplina
-- =========================================================

-- 0) Extensiones necesarias
create extension if not exists pgcrypto;          -- gen_random_uuid()
create extension if not exists moddatetime;       -- opcional; si no está, usamos trigger manual
-- Nota: si 'moddatetime' no existe en tu instancia, el bloque de trigger manual
-- de updated_at ya viene incluido abajo.

-- 1) Función genérica para updated_at (por si no usas moddatetime)
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2) DISCIPLINES
create table if not exists public.disciplines (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,          -- "boxing", "singing", "dance"
  name        text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_disciplines_updated_at
before update on public.disciplines
for each row execute function update_updated_at_column();

-- 3) EVENTS
create table if not exists public.events (
  id               uuid primary key default gen_random_uuid(),
  discipline_id    uuid not null references public.disciplines(id) on delete restrict,
  title            text not null,
  description      text,
  starts_at        timestamptz not null,
  ends_at          timestamptz,
  public           boolean not null default true,      -- visible a todos
  allow_guest_votes boolean not null default true,     -- si se permiten votos sin login (Edge Function)
  created_by       uuid not null,                      -- auth.uid() del creador
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_events_discipline on public.events(discipline_id);
create index if not exists idx_events_time on public.events(starts_at, ends_at);
create index if not exists idx_events_public_active on public.events(public, active);

create trigger trg_events_updated_at
before update on public.events
for each row execute function update_updated_at_column();

-- 4) CONTESTANTS
create table if not exists public.contestants (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events(id) on delete cascade,
  name         text not null,
  avatar_url   text,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_contestants_event on public.contestants(event_id);

create trigger trg_contestants_updated_at
before update on public.contestants
for each row execute function update_updated_at_column();

-- 5) ROUNDS (Rondas o Heats)
-- strategy: 'binary' | 'score_10' | 'ranked' | 'multi'
create table if not exists public.rounds (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.events(id) on delete cascade,
  name              text not null,                         -- "Round 1", "Semifinal", etc.
  strategy          text not null,                         -- ver comentario arriba
  strategy_config   jsonb not null default '{}'::jsonb,    -- p.ej { "max_votes_per_user": 1 }
  voting_opens_at   timestamptz not null,
  voting_closes_at  timestamptz not null,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_rounds_event on public.rounds(event_id);
create index if not exists idx_rounds_window on public.rounds(voting_opens_at, voting_closes_at);
create index if not exists idx_rounds_strategy on public.rounds(strategy);

create trigger trg_rounds_updated_at
before update on public.rounds
for each row execute function update_updated_at_column();

-- 6) ROUND_CONTESTANTS (many-to-many)
create table if not exists public.round_contestants (
  round_id       uuid not null references public.rounds(id) on delete cascade,
  contestant_id  uuid not null references public.contestants(id) on delete cascade,
  primary key (round_id, contestant_id)
);

create index if not exists idx_round_contestants_round on public.round_contestants(round_id);
create index if not exists idx_round_contestants_contestant on public.round_contestants(contestant_id);

-- 7) VOTES (append-only)
-- value_json: flexible para soportar varias estrategias (binary, score, ranked)
create table if not exists public.votes (
  id           bigserial primary key,
  round_id     uuid not null references public.rounds(id) on delete cascade,
  user_id      uuid,                              -- null si guest (edge function)
  device_id    text,                              -- fingerprint simple / uuid local
  ip           inet,                              -- guardado por edge function
  value_json   jsonb not null,                    -- ej: {"contestantId":"...", "value":1}
  created_at   timestamptz not null default now()
);

create index if not exists idx_votes_round on public.votes(round_id);
create index if not exists idx_votes_user on public.votes(user_id);
create index if not exists idx_votes_device on public.votes(device_id);
create index if not exists idx_votes_created on public.votes(created_at);

-- 8) ROUND_TOTALS (acumulado en caliente para scoreboards)
create table if not exists public.round_totals (
  round_id       uuid not null references public.rounds(id) on delete cascade,
  contestant_id  uuid not null references public.contestants(id) on delete cascade,
  total          numeric not null default 0,
  updated_at     timestamptz not null default now(),
  primary key (round_id, contestant_id)
);

create index if not exists idx_round_totals_round on public.round_totals(round_id);
create index if not exists idx_round_totals_top on public.round_totals(round_id, total desc);

-- Trigger de updated_at para round_totals
create or replace function touch_round_totals_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_round_totals_updated_at on public.round_totals;
create trigger trg_round_totals_updated_at
before update on public.round_totals
for each row execute function touch_round_totals_updated_at();

-- 9) LÓGICA: aplicar voto a totales según 'strategy'
create or replace function public.apply_vote_to_totals()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  s text;
  chosen uuid;
  score numeric := 1;
begin
  select strategy into s
  from public.rounds
  where id = new.round_id;

  if s = 'binary' then
    -- value_json: {"contestantId":"uuid"}
    chosen := (new.value_json->>'contestantId')::uuid;
    score := 1;
    insert into public.round_totals(round_id, contestant_id, total)
      values(new.round_id, chosen, score)
    on conflict (round_id, contestant_id) do
      update set total = public.round_totals.total + excluded.total;

  elsif s = 'score_10' then
    -- value_json: {"contestantId":"uuid","value":0..10}
    chosen := (new.value_json->>'contestantId')::uuid;
    score := greatest(0, least(10, coalesce((new.value_json->>'value')::numeric, 0)));
    insert into public.round_totals(round_id, contestant_id, total)
      values(new.round_id, chosen, score)
    on conflict (round_id, contestant_id) do
      update set total = public.round_totals.total + excluded.total;

  elsif s = 'ranked' then
    -- value_json: {"ranking":["uuid1","uuid2","uuid3",...]}
    -- ejemplo de puntaje: n, n-1, n-2...
    declare
      n int;
      i int := 1;
      cid uuid;
      arr text[];
    begin
      arr := array(select jsonb_array_elements_text(new.value_json->'ranking'));
      n := array_length(arr, 1);
      if n is null then
        return new;
      end if;

      foreach cid in array arr loop
        score := (n - i + 1); -- primer lugar más puntaje
        insert into public.round_totals(round_id, contestant_id, total)
          values(new.round_id, cid, score)
        on conflict (round_id, contestant_id) do
          update set total = public.round_totals.total + excluded.total;
        i := i + 1;
      end loop;
    end;

  elsif s = 'multi' then
    -- value_json: {"votes":[{"contestantId":"...","value":X}, ...]}
    declare
      v jsonb;
    begin
      for v in select * from jsonb_array_elements(new.value_json->'votes') loop
        chosen := (v->>'contestantId')::uuid;
        score := coalesce((v->>'value')::numeric, 1);
        insert into public.round_totals(round_id, contestant_id, total)
          values(new.round_id, chosen, score)
        on conflict (round_id, contestant_id) do
          update set total = public.round_totals.total + excluded.total;
      end loop;
    end;

  else
    -- estrategia desconocida: no sumar
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_votes_on_insert on public.votes;
create trigger trg_votes_on_insert
after insert on public.votes
for each row execute function public.apply_vote_to_totals();

-- 10) VIEWS útiles para leaderboards
create or replace view public.vw_round_leaderboard as
select
  r.id as round_id,
  r.name as round_name,
  c.id as contestant_id,
  c.name as contestant_name,
  rt.total,
  rank() over (partition by r.id order by rt.total desc, c.name asc) as position
from public.rounds r
join public.round_totals rt on rt.round_id = r.id
join public.contestants c on c.id = rt.contestant_id;

-- 11) RLS (Row Level Security) – activar y políticas
alter table public.disciplines enable row level security;
alter table public.events enable row level security;
alter table public.contestants enable row level security;
alter table public.rounds enable row level security;
alter table public.round_contestants enable row level security;
alter table public.votes enable row level security;
alter table public.round_totals enable row level security;

-- Lectura pública de catálogos y scoreboards
drop policy if exists "disciplines_public_read" on public.disciplines;
create policy "disciplines_public_read"
on public.disciplines for select
using (active = true);

drop policy if exists "events_public_read" on public.events;
create policy "events_public_read"
on public.events for select
using (public = true and active = true);

drop policy if exists "contestants_public_read" on public.contestants;
create policy "contestants_public_read"
on public.contestants for select
using (true);

drop policy if exists "rounds_public_read" on public.rounds;
create policy "rounds_public_read"
on public.rounds for select
using (active = true);

drop policy if exists "round_contestants_public_read" on public.round_contestants;
create policy "round_contestants_public_read"
on public.round_contestants for select
using (true);

drop policy if exists "round_totals_public_read" on public.round_totals;
create policy "round_totals_public_read"
on public.round_totals for select
using (true);

-- Propietario puede gestionar sus eventos (CRUD)
drop policy if exists "events_owner_manage" on public.events;
create policy "events_owner_manage"
on public.events for all
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

-- Concursantes/rounds del dueño del evento
drop policy if exists "contestants_owner_manage" on public.contestants;
create policy "contestants_owner_manage"
on public.contestants for all
using (
  exists (
    select 1 from public.events e where e.id = contestants.event_id and e.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.events e where e.id = contestants.event_id and e.created_by = auth.uid()
  )
);

drop policy if exists "rounds_owner_manage" on public.rounds;
create policy "rounds_owner_manage"
on public.rounds for all
using (
  exists (
    select 1 from public.events e where e.id = rounds.event_id and e.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.events e where e.id = rounds.event_id and e.created_by = auth.uid()
  )
);

drop policy if exists "round_contestants_owner_manage" on public.round_contestants;
create policy "round_contestants_owner_manage"
on public.round_contestants for all
using (
  exists (
    select 1
    from public.rounds r
    join public.events e on e.id = r.event_id
    where r.id = round_contestants.round_id
      and e.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.rounds r
    join public.events e on e.id = r.event_id
    where r.id = round_contestants.round_id
      and e.created_by = auth.uid()
  )
);

-- VOTOS: Insertar sólo si la ventana está abierta.
-- Nota: Si quieres obligar login, añade "and auth.uid() is not null" en WITH CHECK.
drop policy if exists "votes_insert_window" on public.votes;
create policy "votes_insert_window"
on public.votes for insert
with check (
  exists (
    select 1 from public.rounds r
    where r.id = votes.round_id
      and now() between r.voting_opens_at and r.voting_closes_at
  )
);

-- Lectura de votos: opcional (en general no es necesario exponer votos crudos)
drop policy if exists "votes_read_owner_only" on public.votes;
create policy "votes_read_owner_only"
on public.votes for select
using (
  -- el dueño del evento puede auditar
  exists (
    select 1
    from public.rounds r
    join public.events e on e.id = r.event_id
    where r.id = votes.round_id
      and e.created_by = auth.uid()
  )
);

-- 12) SEED opcional (quita/ajusta en producción)
-- INSERT inicial de disciplinas comunes
insert into public.disciplines (slug, name)
values
  ('boxing','Boxeo'),
  ('singing','Canto'),
  ('dance','Baile')
on conflict (slug) do nothing;