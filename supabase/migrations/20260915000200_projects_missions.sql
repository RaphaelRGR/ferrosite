-- AUTH-003 / PORTAL-002 / PORTAL-003 — projetos, equipe e missões (10, 11).
-- Máquinas de estado no servidor, histórico de negócio separado da auditoria,
-- checklist e comentários de missão, guardas de integridade (responsável é membro;
-- remover membro exige reatribuir missões abertas) e busca de perfil por e-mail
-- com escopo. A UI nunca é a autoridade: tudo aqui vale para acesso direto à API.

-- ─── Estados do projeto (10): rascunho → planejamento → ativo → pausado → concluído → arquivado; cancelado terminal
alter type public.project_status add value if not exists 'draft' before 'planned';
alter type public.project_status add value if not exists 'cancelled';

-- ─── Campos mínimos do projeto (10) ────────────────────────────────────────
alter table public.project
  add column name_en text not null default '',
  add column summary_en text not null default '',
  add column category text not null default 'other'
    check (category in ('research', 'extension', 'competition', 'communication', 'rd', 'other')),
  add column starts_on date,
  add column ends_on date,
  add column modules text[] not null default array['overview', 'team', 'missions'],
  add constraint project_period check (starts_on is null or ends_on is null or ends_on >= starts_on);

alter table public.mission
  add column deliverables text not null default '',
  add column completed_at timestamptz;

-- ─── Checklist e comentários (10) ──────────────────────────────────────────
create table public.mission_checklist_item (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.mission (id) on delete cascade,
  label text not null check (length(label) between 1 and 300),
  done boolean not null default false,
  position integer not null default 0,
  created_by uuid not null references public.profile (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index mission_checklist_item_mission_idx on public.mission_checklist_item (mission_id, position);

create table public.mission_comment (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.mission (id) on delete cascade,
  author_id uuid not null references public.profile (id),
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  edited_at timestamptz
);
create index mission_comment_mission_idx on public.mission_comment (mission_id, created_at);

-- ─── Histórico de negócio (10: "histórico identifica ator/origem/destino/data") ──
-- Visível aos membros do projeto; escrita só por trigger/função security definer.
create table public.activity_event (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.project (id) on delete cascade,
  mission_id uuid references public.mission (id) on delete cascade,
  actor_id uuid references public.profile (id),
  kind text not null,
  from_value text,
  to_value text,
  occurred_at timestamptz not null default now(),
  payload jsonb
);
create index activity_event_project_idx on public.activity_event (project_id, occurred_at desc);
create index activity_event_mission_idx on public.activity_event (mission_id, occurred_at desc);

create or replace function public.log_activity(
  p_project uuid, p_mission uuid, p_kind text, p_from text default null, p_to text default null, p_payload jsonb default null
) returns void
language sql security definer set search_path = public
as $$
  insert into public.activity_event (project_id, mission_id, actor_id, kind, from_value, to_value, payload)
  values (p_project, p_mission, auth.uid(), p_kind, p_from, p_to, p_payload)
$$;
-- Só triggers/funções security definer escrevem histórico: nem authenticated chama direto.
revoke all on function public.log_activity(uuid, uuid, text, text, text, jsonb) from public, anon, authenticated;

-- ─── Helpers ───────────────────────────────────────────────────────────────
-- Membership vigente de um perfil qualquer (para guardas de responsável).
create or replace function public.is_member_of(p_project uuid, p_profile uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.project_membership m
    join public.profile p on p.id = m.profile_id
    where m.project_id = p_project and m.profile_id = p_profile
      and m.status = 'active' and (m.expires_at is null or m.expires_at > now())
      and p.status = 'active'
  )
$$;

-- Pode gerir a missão: overseer, líder do projeto, autor ou responsável.
create or replace function public.can_manage_mission(p_mission uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.mission m
    where m.id = p_mission
      and (
        public.is_project_overseer()
        or public.is_project_leader(m.project_id)
        or m.created_by = auth.uid()
        or exists (select 1 from public.mission_assignee a where a.mission_id = m.id and a.profile_id = auth.uid())
      )
  )
$$;

create or replace function public.mission_project(p_mission uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select m.project_id from public.mission m where m.id = p_mission
$$;

-- Busca de perfil por e-mail exato para incluir na equipe: só overseer ou líder
-- de algum projeto; devolve o mínimo; registra na auditoria (11: busca respeita escopo).
create or replace function public.find_profile_by_email(p_email text)
returns table (id uuid, full_name text, email text, status public.account_status)
language plpgsql security definer set search_path = public
as $$
begin
  if not (public.is_project_overseer() or exists (
    select 1 from public.project_membership m
    where m.profile_id = auth.uid() and m.role = 'leader' and m.status = 'active'
      and (m.expires_at is null or m.expires_at > now())
  )) then
    raise exception 'sem permissão para buscar perfis' using errcode = '42501';
  end if;
  perform public.log_audit('profile.lookup', 'profile', lower(p_email), 'ok', null);
  return query
    select p.id, p.full_name, p.email, p.status
    from public.profile p
    where lower(p.email) = lower(trim(p_email))
    limit 1;
end $$;
revoke all on function public.find_profile_by_email(text) from public;
grant execute on function public.find_profile_by_email(text) to authenticated;

-- ─── Máquina de estados do projeto ─────────────────────────────────────────
create or replace function public.guard_project_transition()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  o text := old.status::text;
  n text := new.status::text;
  allowed boolean;
begin
  if o = n then
    return new;
  end if;
  allowed := case o
    when 'draft'     then n in ('planned', 'active', 'cancelled')
    when 'planned'   then n in ('draft', 'active', 'cancelled')
    when 'active'    then n in ('paused', 'completed', 'cancelled')
    when 'paused'    then n in ('active', 'cancelled')
    when 'completed' then n in ('archived', 'active')
    when 'archived'  then n in ('active', 'planned')
    else false  -- cancelled é terminal
  end;
  if not allowed then
    raise exception 'transição de projeto inválida: % → %', o, n using errcode = '23514';
  end if;
  -- Reativar (sair de arquivado) e reabrir concluído exigem overseer (10/11).
  if auth.uid() is not null and (o = 'archived' or (o = 'completed' and n = 'active')) and not public.is_project_overseer() then
    raise exception 'apenas coordenação/administração reativa projetos' using errcode = '42501';
  end if;
  if n = 'archived' then
    new.archived_at := now();
  elsif o = 'archived' then
    new.archived_at := null;
  end if;
  perform public.log_activity(new.id, null, 'project.status', o, n, null);
  if n = 'archived' or o = 'archived' then
    perform public.log_audit('project.' || case when n = 'archived' then 'archived' else 'reactivated' end, 'project', new.id::text, 'ok',
      jsonb_build_object('from', o, 'to', n));
  end if;
  return new;
end $$;

create trigger project_transition before update of status on public.project
  for each row execute function public.guard_project_transition();

-- Projeto nunca é apagado (10: arquivar preserva relações).
create or replace function public.forbid_delete()
returns trigger language plpgsql as $$
begin
  raise exception 'exclusão não permitida em %: arquive ou cancele', tg_table_name using errcode = '42501';
end $$;
create trigger project_no_delete before delete on public.project for each row execute function public.forbid_delete();
create trigger mission_no_delete before delete on public.mission for each row execute function public.forbid_delete();

-- ─── Máquina de estados da missão ──────────────────────────────────────────
-- Planejada → Em execução → Em validação → Concluída; Pausada/Cancelada por
-- transição autorizada (líder/overseer); Atrasada é derivada (due_at < now), não estado.
create or replace function public.guard_mission_transition()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  o text := old.status::text;
  n text := new.status::text;
  allowed boolean;
  privileged boolean;
begin
  if o = n then
    return new;
  end if;
  allowed := case o
    when 'planned'       then n in ('in_progress', 'paused', 'cancelled')
    when 'in_progress'   then n in ('in_validation', 'paused', 'cancelled')
    when 'in_validation' then n in ('done', 'in_progress', 'cancelled')
    when 'paused'        then n in ('in_progress', 'cancelled')
    when 'done'          then n in ('in_progress')
    else false  -- cancelled é terminal
  end;
  if not allowed then
    raise exception 'transição de missão inválida: % → %', o, n using errcode = '23514';
  end if;
  privileged := auth.uid() is null or public.is_project_overseer() or public.is_project_leader(new.project_id);
  -- Validar (→ concluída), reabrir, pausar e cancelar são do líder/overseer.
  if n in ('done', 'paused', 'cancelled') and not privileged then
    raise exception 'transição reservada ao líder do projeto ou à coordenação' using errcode = '42501';
  end if;
  if o = 'done' and not privileged then
    raise exception 'reabrir missão é reservado ao líder do projeto ou à coordenação' using errcode = '42501';
  end if;
  new.completed_at := case when n = 'done' then now() else null end;
  perform public.log_activity(new.project_id, new.id, 'mission.status', o, n, null);
  return new;
end $$;

create trigger mission_transition before update of status on public.mission
  for each row execute function public.guard_mission_transition();

-- Missão não muda de projeto; nasce registrada no histórico (AFTER: a FK exige a linha).
create or replace function public.guard_mission_project()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.project_id <> old.project_id then
    raise exception 'missão não pode mudar de projeto' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger mission_project_guard before update of project_id on public.mission
  for each row execute function public.guard_mission_project();

create or replace function public.log_mission_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.log_activity(new.project_id, new.id, 'mission.created', null, new.status::text, jsonb_build_object('title', new.title));
  return new;
end $$;
create trigger mission_created after insert on public.mission
  for each row execute function public.log_mission_created();

-- ─── Responsável deve ser membro vigente do projeto (10) ───────────────────
create or replace function public.guard_assignee_membership()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  pid uuid;
begin
  pid := public.mission_project(new.mission_id);
  if not public.is_member_of(pid, new.profile_id) and not (
    -- overseers podem ser responsáveis mesmo sem membership explícita
    select p.status = 'active' and p.global_role in ('admin', 'coordination') from public.profile p where p.id = new.profile_id
  ) then
    raise exception 'responsável precisa ser membro ativo do projeto' using errcode = '23514';
  end if;
  perform public.log_activity(pid, new.mission_id, 'mission.assigned', null, new.profile_id::text, null);
  return new;
end $$;
create trigger assignee_membership before insert on public.mission_assignee
  for each row execute function public.guard_assignee_membership();

create or replace function public.log_unassign()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.log_activity(public.mission_project(old.mission_id), old.mission_id, 'mission.unassigned', old.profile_id::text, null, null);
  return old;
end $$;
create trigger assignee_unassign after delete on public.mission_assignee
  for each row execute function public.log_unassign();

-- ─── Remover membro com missão aberta exige reatribuição explícita (10) ────
create or replace function public.guard_membership_removal()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  open_count integer;
begin
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and new.status = 'removed' and old.status <> 'removed') then
    select count(*) into open_count
    from public.mission_assignee a
    join public.mission m on m.id = a.mission_id
    where a.profile_id = old.profile_id and m.project_id = old.project_id
      and m.status not in ('done', 'cancelled');
    if open_count > 0 then
      raise exception 'membro tem % missão(ões) aberta(s): reatribua antes de remover', open_count using errcode = '23514';
    end if;
  end if;
  return coalesce(new, old);
end $$;
create trigger membership_removal before update or delete on public.project_membership
  for each row execute function public.guard_membership_removal();

-- ─── updated_at nas tabelas novas ──────────────────────────────────────────
create trigger checklist_touch before update on public.mission_checklist_item for each row execute function public.touch_updated_at();

-- ─── RLS ───────────────────────────────────────────────────────────────────
alter table public.mission_checklist_item enable row level security;
alter table public.mission_comment enable row level security;
alter table public.activity_event enable row level security;

-- checklist: leitura por membros/overseers; gestão por quem gere a missão.
create policy checklist_select on public.mission_checklist_item for select to authenticated
  using (public.is_project_overseer() or public.is_project_member(public.mission_project(mission_id)));
create policy checklist_manage on public.mission_checklist_item for all to authenticated
  using (public.can_manage_mission(mission_id))
  with check (public.can_manage_mission(mission_id) and created_by = auth.uid());

-- comentários: membros leem e escrevem (autor = si); edição pelo autor; remoção pelo autor, líder ou overseer.
create policy comment_select on public.mission_comment for select to authenticated
  using (public.is_project_overseer() or public.is_project_member(public.mission_project(mission_id)));
create policy comment_insert on public.mission_comment for insert to authenticated
  with check (author_id = auth.uid() and (public.is_project_overseer() or public.is_project_member(public.mission_project(mission_id))));
create policy comment_update_own on public.mission_comment for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy comment_delete on public.mission_comment for delete to authenticated
  using (author_id = auth.uid() or public.is_project_overseer() or public.is_project_leader(public.mission_project(mission_id)));

-- histórico: leitura por membros/overseers; sem insert/update/delete direto.
create policy activity_select on public.activity_event for select to authenticated
  using (public.is_project_overseer() or public.is_project_member(project_id));

revoke all on all tables in schema public from anon;
