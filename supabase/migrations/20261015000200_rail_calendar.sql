-- CAL-001: calendário ferroviário (eventos do setor no Brasil e no mundo).
-- Administração/coordenação cadastram e removem; o site mostra sempre o ano corrente (fuso do curso);
-- só o ano corrente e o próximo podem ser alterados: anos passados ficam como registro, nada some sozinho.

create type public.rail_event_region as enum ('brasil', 'mundo');
create type public.rail_event_kind as enum ('feira', 'congresso', 'seminario', 'curso', 'outro');

create table public.rail_event (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 200),
  starts_on date not null,
  ends_on date,
  year integer generated always as (extract(year from starts_on)::integer) stored,
  city text not null default '' check (length(city) <= 120),
  -- código ISO 3166-1 alfa-2 (o site mostra o nome do país no idioma da página); vazio = online/indefinido
  country text not null default '' check (country = '' or country ~ '^[A-Z]{2}$'),
  region public.rail_event_region not null default 'brasil',
  kind public.rail_event_kind not null default 'outro',
  url text not null default '' check (url = '' or url ~ '^https?://[^\s]+$'),
  description text not null default '' check (length(description) <= 600),
  description_en text not null default '' check (length(description_en) <= 600),
  -- de onde veio a data (interno; não vai para o site)
  source_note text not null default '' check (length(source_note) <= 500),
  created_by uuid not null references public.profile (id),
  updated_by uuid not null references public.profile (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  constraint rail_event_dates check (ends_on is null or ends_on >= starts_on)
);
create index rail_event_year_idx on public.rail_event (year, starts_on);
create trigger rail_event_touch before update on public.rail_event for each row execute function public.touch_updated_at();

-- Ano do calendário no fuso do curso (o site vira o ano sozinho em 1º de janeiro).
create or replace function public.rail_calendar_year()
returns integer language sql stable set search_path = public as $$
  select extract(year from (now() at time zone 'America/Sao_Paulo'))::integer
$$;
grant execute on function public.rail_calendar_year() to anon, authenticated;

-- Janela de edição: ano corrente e próximo. Sem usuário (migrations/operador) passa.
create or replace function public.guard_rail_event_window()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  y integer := public.rail_calendar_year();
begin
  if auth.uid() is null then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  if tg_op in ('UPDATE', 'DELETE') and old.year not in (y, y + 1) then
    raise exception 'o calendário de % é registro: só % e % podem ser alterados', old.year, y, y + 1 using errcode = '42501';
  end if;
  if tg_op in ('INSERT', 'UPDATE') and extract(year from new.starts_on)::integer not in (y, y + 1) then
    raise exception 'só dá para cadastrar eventos de % e %', y, y + 1 using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then
    perform public.log_audit('rail_event.deleted', 'rail_event', old.id::text, 'ok', jsonb_build_object('name', old.name, 'starts_on', old.starts_on));
    return old;
  end if;
  return new;
end $$;
create trigger rail_event_window before insert or update or delete on public.rail_event
  for each row execute function public.guard_rail_event_window();

alter table public.rail_event enable row level security;
create policy rail_event_select on public.rail_event for select to authenticated
  using (public.is_project_overseer());
create policy rail_event_insert on public.rail_event for insert to authenticated
  with check (public.is_project_overseer() and created_by = auth.uid() and updated_by = auth.uid());
create policy rail_event_update on public.rail_event for update to authenticated
  using (public.is_project_overseer()) with check (public.is_project_overseer() and updated_by = auth.uid());
create policy rail_event_delete on public.rail_event for delete to authenticated
  using (public.is_project_overseer());
grant select, insert, update, delete on public.rail_event to authenticated;
-- só a tabela nova: um revoke geral apagaria os grants das views públicas do site
revoke all on public.rail_event from anon;

-- Projeção pública: só o ano corrente e só campos públicos (sem nota de fonte nem autoria).
create view public.public_rail_event with (security_invoker = false) as
  select id, name, starts_on, ends_on, city, country, region, kind, url, description, description_en
  from public.rail_event
  where year = public.rail_calendar_year();
grant select on public.public_rail_event to anon, authenticated;
