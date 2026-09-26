-- ACT-001: Ações (work items) da administração e da coordenação.
-- Camada transversal e PRIVADA: admin e coordenação veem tudo; qualquer outra
-- pessoa só enxerga o item em que é responsável ou aprovadora (exceção por
-- item), com seus comentários, histórico e arquivos. Estados e permissões são
-- decididos aqui (triggers + RLS); o TypeScript só espelha para a interface.

create type public.work_item_kind as enum ('action', 'approval', 'decision', 'follow_up');
create type public.work_item_status as enum ('inbox', 'planned', 'in_progress', 'waiting', 'awaiting_approval', 'done', 'blocked', 'cancelled');
create type public.waiting_party as enum ('coordination', 'admin', 'student', 'professor', 'company', 'supplier', 'secretariat', 'transport', 'ufsc', 'other');

create table public.work_item (
  id uuid primary key default gen_random_uuid(),
  kind public.work_item_kind not null default 'action',
  title text not null check (length(title) between 2 and 200),
  description text not null default '' check (length(description) <= 4000),
  status public.work_item_status not null default 'planned',
  priority public.mission_priority not null default 'medium',
  -- Um único dono ("quem é o dono disso?"); só a Entrada admite item sem dono.
  owner_id uuid references public.profile (id),
  due_at timestamptz,
  approver_id uuid references public.profile (id),
  approved_by uuid references public.profile (id),
  approved_at timestamptz,
  -- "Aguardando quem?": só preenchido enquanto o item está em espera.
  waiting_on public.waiting_party,
  waiting_note text not null default '' check (length(waiting_note) <= 300),
  waiting_since timestamptz,
  -- Etapa 2 (Lembrar depois / decisões com opções): colunas já disponíveis.
  snoozed_until timestamptz,
  decision_options text[] not null default '{}',
  decision_outcome text not null default '' check (length(decision_outcome) <= 1000),
  decided_by uuid references public.profile (id),
  decided_at timestamptz,
  -- Nota da última mudança de status (ex.: o que ajustar). Vai para o histórico e é zerada pelo trigger.
  status_note text not null default '' check (length(status_note) <= 1000),
  project_id uuid references public.project (id),
  mission_id uuid references public.mission (id),
  organization_id uuid references public.organization (id),
  created_by uuid not null references public.profile (id),
  updated_by uuid not null references public.profile (id),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  constraint work_item_owner_required check (status = 'inbox' or owner_id is not null),
  constraint work_item_waiting_consistency check ((status = 'waiting') = (waiting_on is not null)),
  constraint work_item_approval_needs_approver check ((kind <> 'approval' and status <> 'awaiting_approval') or approver_id is not null)
);
create index work_item_owner_idx on public.work_item (owner_id, status);
create index work_item_approver_idx on public.work_item (approver_id, status);
create index work_item_status_due_idx on public.work_item (status, due_at);

create table public.work_item_event (
  id bigint generated always as identity primary key,
  item_id uuid not null references public.work_item (id) on delete cascade,
  actor_id uuid references public.profile (id),
  kind text not null,
  from_value text,
  to_value text,
  note text not null default '',
  occurred_at timestamptz not null default now()
);
create index work_item_event_item_idx on public.work_item_event (item_id, occurred_at);

create table public.work_item_comment (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.work_item (id) on delete cascade,
  author_id uuid not null references public.profile (id),
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index work_item_comment_item_idx on public.work_item_comment (item_id, created_at);

create table public.work_item_file (
  item_id uuid not null references public.work_item (id) on delete cascade,
  file_id uuid not null references public.file_asset (id) on delete cascade,
  linked_by uuid not null references public.profile (id),
  linked_at timestamptz not null default now(),
  primary key (item_id, file_id)
);

-- ─── Visibilidade ──────────────────────────────────────────────────────────
create or replace function public.can_view_work_item(p_item uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.work_item w
    where w.id = p_item
      and (public.is_project_overseer() or (public.is_active_user() and (w.owner_id = auth.uid() or w.approver_id = auth.uid())))
  )
$$;

-- Arquivo vinculado a uma ação é visível a quem vê a ação (mesmas regras de antes + esta).
create or replace function public.can_view_file(p_file uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_project_overseer()
    or exists (select 1 from public.file_asset f where f.id = p_file and f.owner_id = auth.uid())
    or exists (select 1 from public.project_file pf where pf.file_id = p_file and public.is_project_member(pf.project_id))
    or exists (select 1 from public.mission_file mf join public.mission m on m.id = mf.mission_id where mf.file_id = p_file and public.is_project_member(m.project_id))
    or exists (select 1 from public.work_item_file wf where wf.file_id = p_file and public.can_view_work_item(wf.item_id))
$$;

-- ─── Histórico (só triggers escrevem) ──────────────────────────────────────
create or replace function public.log_work_item(p_item uuid, p_kind text, p_from text default null, p_to text default null, p_note text default '')
returns void
language sql security definer set search_path = public
as $$
  insert into public.work_item_event (item_id, actor_id, kind, from_value, to_value, note)
  values (p_item, auth.uid(), p_kind, p_from, p_to, coalesce(p_note, ''))
$$;
revoke all on function public.log_work_item(uuid, text, text, text, text) from public, anon, authenticated;

-- ─── Criação ───────────────────────────────────────────────────────────────
create or replace function public.guard_work_item_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status not in ('inbox', 'planned', 'awaiting_approval') then
    raise exception 'ação nasce na Entrada, planejada ou aguardando aprovação' using errcode = '23514';
  end if;
  if new.status = 'awaiting_approval' and new.approver_id = new.owner_id then
    raise exception 'quem responde pela ação não aprova a própria entrega' using errcode = '23514';
  end if;
  new.waiting_on := null;
  new.waiting_note := '';
  new.waiting_since := null;
  new.status_note := '';
  new.completed_at := null;
  new.approved_by := null;
  new.approved_at := null;
  return new;
end $$;
create trigger work_item_insert_guard before insert on public.work_item
  for each row execute function public.guard_work_item_insert();

create or replace function public.log_work_item_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.log_work_item(new.id, 'created', null, new.status::text, '');
  if new.status = 'awaiting_approval' then
    perform public.log_work_item(new.id, 'approval_requested', null, new.approver_id::text, '');
  end if;
  return new;
end $$;
create trigger work_item_created after insert on public.work_item
  for each row execute function public.log_work_item_created();

-- ─── Transições e campos ───────────────────────────────────────────────────
-- Entrada → Planejada → Em execução ⇄ Aguardando/Bloqueada → Aguardando aprovação → Concluída.
-- Aprovar e pedir alterações são do aprovador; item com aprovador só conclui pela aprovação.
create or replace function public.guard_work_item_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  o text := old.status::text;
  n text := new.status::text;
  overseer boolean := auth.uid() is null or public.is_project_overseer();
  allowed boolean;
  note text := coalesce(new.status_note, '');
begin
  new.status_note := '';

  -- Quem não é admin/coordenação só mexe no andamento do próprio item.
  if not overseer and (
    new.owner_id is distinct from old.owner_id or new.approver_id is distinct from old.approver_id
    or new.due_at is distinct from old.due_at or new.kind <> old.kind or new.title <> old.title
    or new.description <> old.description or new.priority <> old.priority
    or new.project_id is distinct from old.project_id or new.mission_id is distinct from old.mission_id
    or new.organization_id is distinct from old.organization_id or new.decision_options <> old.decision_options
  ) then
    raise exception 'apenas administração e coordenação alteram responsável, prazo e dados da ação' using errcode = '42501';
  end if;

  if o <> n then
    allowed := case o
      when 'inbox'             then n in ('planned', 'in_progress', 'cancelled')
      when 'planned'           then n in ('in_progress', 'waiting', 'blocked', 'awaiting_approval', 'done', 'cancelled')
      when 'in_progress'       then n in ('planned', 'waiting', 'blocked', 'awaiting_approval', 'done', 'cancelled')
      when 'waiting'           then n in ('in_progress', 'planned', 'blocked', 'awaiting_approval', 'done', 'cancelled')
      when 'blocked'           then n in ('in_progress', 'planned', 'waiting', 'cancelled')
      when 'awaiting_approval' then n in ('done', 'in_progress', 'cancelled')
      when 'done'              then n in ('in_progress')
      when 'cancelled'         then n in ('planned')
      else false
    end;
    if not allowed then
      raise exception 'transição de ação inválida: % → %', o, n using errcode = '23514';
    end if;

    if n = 'awaiting_approval' then
      if new.approver_id is null then
        raise exception 'escolha quem aprova antes de pedir aprovação' using errcode = '23514';
      end if;
      if new.approver_id = new.owner_id then
        raise exception 'quem responde pela ação não aprova a própria entrega' using errcode = '23514';
      end if;
    end if;

    if o = 'awaiting_approval' and n in ('done', 'in_progress') then
      if auth.uid() is not null and auth.uid() is distinct from old.approver_id then
        raise exception 'só quem foi indicado para aprovar pode aprovar ou pedir alterações' using errcode = '42501';
      end if;
      if n = 'in_progress' and length(trim(note)) = 0 then
        raise exception 'diga o que precisa ser ajustado' using errcode = '23514';
      end if;
    end if;

    if n = 'done' and o <> 'awaiting_approval' and new.approver_id is not null and new.kind <> 'decision' then
      raise exception 'ação com aprovador é concluída pela aprovação' using errcode = '23514';
    end if;

    if (o in ('done', 'cancelled')) and not overseer then
      raise exception 'reabrir é reservado à administração e à coordenação' using errcode = '42501';
    end if;

    -- espera: "desde" automático; ao sair, limpa quem era aguardado
    if n = 'waiting' then
      new.waiting_since := now();
    elsif o = 'waiting' then
      new.waiting_on := null;
      new.waiting_note := '';
      new.waiting_since := null;
    end if;

    new.completed_at := case when n = 'done' then now() else null end;

    if o = 'awaiting_approval' and n = 'done' then
      new.approved_by := auth.uid();
      new.approved_at := now();
      perform public.log_work_item(new.id, 'approved', null, null, note);
      perform public.log_audit('work_item.approved', 'work_item', new.id::text, 'ok', null);
    elsif o = 'awaiting_approval' and n = 'in_progress' then
      perform public.log_work_item(new.id, 'changes_requested', null, null, note);
      perform public.log_audit('work_item.changes_requested', 'work_item', new.id::text, 'ok', null);
    elsif n = 'awaiting_approval' then
      perform public.log_work_item(new.id, 'approval_requested', null, new.approver_id::text, note);
    else
      perform public.log_work_item(new.id, 'status', o, n, note);
    end if;
  elsif new.status = 'waiting' and (new.waiting_on is distinct from old.waiting_on or new.waiting_note <> old.waiting_note) then
    new.waiting_since := coalesce(old.waiting_since, now());
  end if;

  if n = 'waiting' and (o <> 'waiting' or new.waiting_on is distinct from old.waiting_on or new.waiting_note <> old.waiting_note) then
    perform public.log_work_item(new.id, 'waiting', null, new.waiting_on::text, new.waiting_note);
  end if;

  -- decisão registrada: quem decidiu e quando (dono ou admin/coordenação)
  if new.decision_outcome <> old.decision_outcome and new.decision_outcome <> '' then
    if new.kind <> 'decision' then
      raise exception 'só itens do tipo decisão registram decisão' using errcode = '23514';
    end if;
    if not overseer and auth.uid() is distinct from old.owner_id then
      raise exception 'só quem responde pela decisão pode registrá-la' using errcode = '42501';
    end if;
    new.decided_by := auth.uid();
    new.decided_at := now();
    perform public.log_work_item(new.id, 'decided', null, null, new.decision_outcome);
  end if;

  if new.owner_id is distinct from old.owner_id then
    perform public.log_work_item(new.id, 'owner', old.owner_id::text, new.owner_id::text, '');
  end if;
  if new.due_at is distinct from old.due_at then
    perform public.log_work_item(new.id, 'due', old.due_at::text, new.due_at::text, '');
  end if;
  if new.approver_id is distinct from old.approver_id and o = n then
    perform public.log_work_item(new.id, 'approver', old.approver_id::text, new.approver_id::text, '');
  end if;
  if new.priority <> old.priority then
    perform public.log_work_item(new.id, 'priority', old.priority::text, new.priority::text, '');
  end if;
  return new;
end $$;
create trigger work_item_update_guard before update on public.work_item
  for each row execute function public.guard_work_item_update();

create trigger work_item_touch before update on public.work_item for each row execute function public.touch_updated_at();
create trigger work_item_no_delete before delete on public.work_item for each row execute function public.forbid_delete();

create or replace function public.log_work_item_file()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  fname text;
begin
  select f.name into fname from public.file_asset f where f.id = coalesce(new.file_id, old.file_id);
  if tg_op = 'INSERT' then
    perform public.log_work_item(new.item_id, 'file_linked', null, new.file_id::text, coalesce(fname, ''));
    return new;
  end if;
  perform public.log_work_item(old.item_id, 'file_unlinked', old.file_id::text, null, coalesce(fname, ''));
  return old;
end $$;
create trigger work_item_file_log after insert or delete on public.work_item_file
  for each row execute function public.log_work_item_file();

-- ─── RLS ───────────────────────────────────────────────────────────────────
alter table public.work_item enable row level security;
alter table public.work_item_event enable row level security;
alter table public.work_item_comment enable row level security;
alter table public.work_item_file enable row level security;

-- Colunas diretas (não só a função): INSERT … RETURNING avalia a policy de SELECT na linha nova.
create policy work_item_select on public.work_item for select to authenticated
  using (public.is_project_overseer() or (public.is_active_user() and (owner_id = auth.uid() or approver_id = auth.uid())));
create policy work_item_insert on public.work_item for insert to authenticated
  with check (public.is_project_overseer() and created_by = auth.uid() and updated_by = auth.uid());
create policy work_item_update on public.work_item for update to authenticated
  using (public.is_project_overseer() or (public.is_active_user() and (owner_id = auth.uid() or approver_id = auth.uid())))
  with check (updated_by = auth.uid());

create policy work_item_event_select on public.work_item_event for select to authenticated
  using (public.can_view_work_item(item_id));

create policy work_item_comment_select on public.work_item_comment for select to authenticated
  using (public.can_view_work_item(item_id));
create policy work_item_comment_insert on public.work_item_comment for insert to authenticated
  with check (author_id = auth.uid() and public.can_view_work_item(item_id));

create policy work_item_file_select on public.work_item_file for select to authenticated
  using (public.can_view_work_item(item_id));
create policy work_item_file_insert on public.work_item_file for insert to authenticated
  with check (linked_by = auth.uid() and public.can_view_work_item(item_id) and public.can_view_file(file_id));
create policy work_item_file_delete on public.work_item_file for delete to authenticated
  using (public.is_project_overseer() or linked_by = auth.uid());

-- Só as tabelas novas: um revoke geral apagaria os grants das views públicas do site.
revoke all on public.work_item, public.work_item_event, public.work_item_comment, public.work_item_file from anon;
