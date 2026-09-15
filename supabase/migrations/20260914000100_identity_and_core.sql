-- AUTH-001 — identidade, papéis, membership, projeto, missão, auditoria.
-- Regras (11/20/21): menor privilégio, decisão final no banco (RLS), fail-closed,
-- auditoria append-only, arquivamento em vez de exclusão, IDs opacos, UTC.

create extension if not exists "pgcrypto";

-- ─── Enums (chaves estáveis; rótulos traduzíveis ficam na UI) ───────────────
create type public.global_role as enum ('admin', 'coordination', 'advisor', 'member', 'external', 'viewer');
create type public.project_role as enum ('leader', 'member', 'viewer', 'external');
create type public.account_status as enum ('pending', 'active', 'disabled');
create type public.membership_status as enum ('active', 'removed');
create type public.project_status as enum ('planned', 'active', 'paused', 'completed', 'archived');
create type public.mission_status as enum ('planned', 'in_progress', 'in_validation', 'done', 'paused', 'cancelled');
create type public.mission_priority as enum ('low', 'medium', 'high');
create type public.classification as enum ('public', 'internal', 'restricted', 'administrative');
create type public.theme_preference as enum ('light', 'dark', 'system');

-- ─── Perfil ────────────────────────────────────────────────────────────────
-- Criado por trigger ao nascer um auth.users; nasce PENDING/viewer (fail-closed):
-- domínio UFSC não concede acesso automático (11). Admin ativa e atribui papel.
create table public.profile (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  global_role public.global_role not null default 'viewer',
  status public.account_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);
create index profile_status_idx on public.profile (status);

create table public.user_preference (
  profile_id uuid primary key references public.profile (id) on delete cascade,
  theme public.theme_preference not null default 'system',
  locale text not null default 'pt' check (locale in ('pt', 'en')),
  updated_at timestamptz not null default now()
);

-- ─── Projeto e membership ──────────────────────────────────────────────────
create table public.project (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(name) between 2 and 160),
  summary text not null default '',
  status public.project_status not null default 'planned',
  classification public.classification not null default 'internal',
  created_by uuid not null references public.profile (id),
  updated_by uuid not null references public.profile (id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  constraint project_archived_consistency check ((status = 'archived') = (archived_at is not null))
);
create index project_status_idx on public.project (status);

create table public.project_membership (
  project_id uuid not null references public.project (id) on delete cascade,
  profile_id uuid not null references public.profile (id) on delete cascade,
  role public.project_role not null default 'member',
  status public.membership_status not null default 'active',
  expires_at timestamptz,
  granted_by uuid references public.profile (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (project_id, profile_id),
  -- Externo expira por padrão (11): grant externo sem prazo é inválido.
  constraint membership_external_expires check (role <> 'external' or expires_at is not null)
);
create index project_membership_profile_idx on public.project_membership (profile_id) where status = 'active';

-- ─── Missão ────────────────────────────────────────────────────────────────
create table public.mission (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project (id) on delete cascade,
  title text not null check (length(title) between 2 and 200),
  description text not null default '',
  status public.mission_status not null default 'planned',
  priority public.mission_priority not null default 'medium',
  due_at timestamptz,
  created_by uuid not null references public.profile (id),
  updated_by uuid not null references public.profile (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);
create index mission_project_status_idx on public.mission (project_id, status);

create table public.mission_assignee (
  mission_id uuid not null references public.mission (id) on delete cascade,
  profile_id uuid not null references public.profile (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (mission_id, profile_id)
);

-- ─── Auditoria (append-only; separada da atividade de negócio) ─────────────
create table public.audit_event (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid references public.profile (id),
  action text not null,
  target_type text not null,
  target_id text,
  result text not null default 'ok' check (result in ('ok', 'denied', 'error')),
  request_id text,
  origin text,
  diff jsonb
);
create index audit_event_target_idx on public.audit_event (target_type, target_id);
create index audit_event_actor_idx on public.audit_event (actor_id, occurred_at desc);

-- ─── Funções auxiliares (security definer, sem depender da RLS da própria tabela) ──
create or replace function public.current_profile_status()
returns public.account_status
language sql stable security definer set search_path = public
as $$
  select p.status from public.profile p where p.id = auth.uid()
$$;

create or replace function public.is_active_user()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select p.status = 'active' from public.profile p where p.id = auth.uid()), false)
$$;

create or replace function public.has_global_role(variadic roles public.global_role[])
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((
    select p.status = 'active' and p.global_role = any (roles)
    from public.profile p where p.id = auth.uid()
  ), false)
$$;

-- Membership vigente: ativa e (sem prazo ou dentro do prazo).
create or replace function public.project_role_of(p_project uuid)
returns public.project_role
language sql stable security definer set search_path = public
as $$
  select m.role
  from public.project_membership m
  where m.project_id = p_project
    and m.profile_id = auth.uid()
    and m.status = 'active'
    and (m.expires_at is null or m.expires_at > now())
    and public.is_active_user()
$$;

create or replace function public.is_project_member(p_project uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.project_role_of(p_project) is not null
$$;

create or replace function public.is_project_leader(p_project uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.project_role_of(p_project) = 'leader'
$$;

-- Pode ver/gerir qualquer projeto: admin e coordenação (11).
create or replace function public.is_project_overseer()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.has_global_role('admin', 'coordination')
$$;

create or replace function public.shares_project_with(p_other uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.project_membership a
    join public.project_membership b on a.project_id = b.project_id
    where a.profile_id = auth.uid() and b.profile_id = p_other
      and a.status = 'active' and b.status = 'active'
      and (a.expires_at is null or a.expires_at > now())
  ) and public.is_active_user()
$$;

-- Registro de auditoria a partir de código de aplicação/trigger (nunca UPDATE/DELETE).
create or replace function public.log_audit(
  p_action text, p_target_type text, p_target_id text,
  p_result text default 'ok', p_diff jsonb default null
) returns void
language sql security definer set search_path = public
as $$
  insert into public.audit_event (actor_id, action, target_type, target_id, result, diff)
  values (auth.uid(), p_action, p_target_type, p_target_id, p_result, p_diff)
$$;

revoke all on function public.log_audit(text, text, text, text, jsonb) from public;
grant execute on function public.log_audit(text, text, text, text, jsonb) to authenticated;

-- ─── Triggers ──────────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if to_jsonb(new) ? 'version' then
    new.version := old.version + 1;
  end if;
  return new;
end $$;

create trigger profile_touch before update on public.profile for each row execute function public.touch_updated_at();
create trigger project_touch before update on public.project for each row execute function public.touch_updated_at();
create trigger membership_touch before update on public.project_membership for each row execute function public.touch_updated_at();
create trigger mission_touch before update on public.mission for each row execute function public.touch_updated_at();
create trigger preference_touch before update on public.user_preference for each row execute function public.touch_updated_at();

-- Perfil nasce junto com o usuário de auth, sempre pendente.
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profile (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  insert into public.user_preference (profile_id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Só admin altera papel/status; ninguém remove o último admin ativo (11).
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  admins_left integer;
begin
  -- Sem usuário (migrations, service role, SQL editor): provisionamento inicial passa sem guard.
  if auth.uid() is null then
    return new;
  end if;
  if (new.global_role is distinct from old.global_role or new.status is distinct from old.status) then
    if not public.has_global_role('admin') then
      raise exception 'apenas administradores alteram papel ou status' using errcode = '42501';
    end if;
    if (old.global_role = 'admin' and old.status = 'active')
       and (new.global_role <> 'admin' or new.status <> 'active') then
      select count(*) into admins_left from public.profile
      where global_role = 'admin' and status = 'active' and id <> old.id;
      if admins_left = 0 then
        raise exception 'o último administrador ativo não pode ser removido' using errcode = '42501';
      end if;
    end if;
    perform public.log_audit('profile.privileges_changed', 'profile', old.id::text, 'ok',
      jsonb_build_object('role', jsonb_build_array(old.global_role, new.global_role),
                         'status', jsonb_build_array(old.status, new.status)));
  end if;
  -- e-mail espelha auth.users; não é editável aqui
  new.email := old.email;
  return new;
end $$;

create trigger profile_guard before update on public.profile for each row execute function public.guard_profile_privileges();

create or replace function public.audit_membership()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.log_audit(
    'membership.' || lower(tg_op), 'project_membership',
    coalesce(new.project_id, old.project_id)::text || ':' || coalesce(new.profile_id, old.profile_id)::text,
    'ok',
    jsonb_build_object('old', case when tg_op <> 'INSERT' then jsonb_build_object('role', old.role, 'status', old.status, 'expires_at', old.expires_at) end,
                       'new', case when tg_op <> 'DELETE' then jsonb_build_object('role', new.role, 'status', new.status, 'expires_at', new.expires_at) end));
  return coalesce(new, old);
end $$;

create trigger membership_audit after insert or update or delete on public.project_membership
  for each row execute function public.audit_membership();

-- ─── RLS: toda tabela privada, negação por padrão ──────────────────────────
alter table public.profile enable row level security;
alter table public.user_preference enable row level security;
alter table public.project enable row level security;
alter table public.project_membership enable row level security;
alter table public.mission enable row level security;
alter table public.mission_assignee enable row level security;
alter table public.audit_event enable row level security;

-- profile: o próprio (mesmo pendente, para ver o status), overseers e colegas de projeto.
create policy profile_select on public.profile for select to authenticated
  using (id = auth.uid() or public.is_project_overseer() or public.shares_project_with(id));
create policy profile_update_own on public.profile for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy profile_update_admin on public.profile for update to authenticated
  using (public.has_global_role('admin')) with check (public.has_global_role('admin'));

-- user_preference: só o próprio.
create policy preference_own on public.user_preference for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- project: membros vigentes e overseers; criação por admin/coordenação/orientador;
-- edição por overseer ou líder; nunca DELETE (arquivar).
create policy project_select on public.project for select to authenticated
  using (public.is_project_overseer() or public.is_project_member(id));
create policy project_insert on public.project for insert to authenticated
  with check (public.has_global_role('admin', 'coordination', 'advisor') and created_by = auth.uid() and updated_by = auth.uid());
create policy project_update on public.project for update to authenticated
  using (public.is_project_overseer() or public.is_project_leader(id))
  with check (updated_by = auth.uid());

-- membership: visível a membros e overseers; gerida por overseer ou líder.
create policy membership_select on public.project_membership for select to authenticated
  using (public.is_project_overseer() or public.is_project_member(project_id));
create policy membership_manage on public.project_membership for all to authenticated
  using (public.is_project_overseer() or public.is_project_leader(project_id))
  with check (public.is_project_overseer() or public.is_project_leader(project_id));

-- mission: membros do projeto; criação por líder/membro; edição por líder, autor ou responsável.
create policy mission_select on public.mission for select to authenticated
  using (public.is_project_overseer() or public.is_project_member(project_id));
create policy mission_insert on public.mission for insert to authenticated
  with check (
    created_by = auth.uid() and updated_by = auth.uid()
    and (public.is_project_overseer() or public.project_role_of(project_id) in ('leader', 'member'))
  );
create policy mission_update on public.mission for update to authenticated
  using (
    public.is_project_overseer() or public.is_project_leader(project_id) or created_by = auth.uid()
    or exists (select 1 from public.mission_assignee a where a.mission_id = id and a.profile_id = auth.uid())
  )
  with check (updated_by = auth.uid());

create policy assignee_select on public.mission_assignee for select to authenticated
  using (exists (select 1 from public.mission m where m.id = mission_id and (public.is_project_overseer() or public.is_project_member(m.project_id))));
create policy assignee_manage on public.mission_assignee for all to authenticated
  using (exists (select 1 from public.mission m where m.id = mission_id and (public.is_project_overseer() or public.is_project_leader(m.project_id) or m.created_by = auth.uid())))
  with check (exists (select 1 from public.mission m where m.id = mission_id and (public.is_project_overseer() or public.is_project_leader(m.project_id) or m.created_by = auth.uid())));

-- audit_event: leitura por admin/coordenação; escrita só via log_audit; sem update/delete.
create policy audit_select on public.audit_event for select to authenticated
  using (public.is_project_overseer());

-- Sem grants para anon em nenhuma tabela (site público lê projeções aprovadas, não tabelas).
revoke all on all tables in schema public from anon;
