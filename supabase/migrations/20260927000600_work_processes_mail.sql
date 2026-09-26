-- ACT-004: processos a partir de modelos (visita técnica primeiro), e-mails das
-- ações e lembretes de prazo. Notificar só o que importa: receber ação, pedido
-- de aprovação, pedido de alteração, menção, prazo em 24 h e atraso. Nunca a
-- quem fez a mudança; nunca 20 e-mails por um processo criado de uma vez.

-- ─── Processos ─────────────────────────────────────────────────────────────
create table public.work_process (
  id uuid primary key default gen_random_uuid(),
  template text not null check (template ~ '^[a-z0-9_]+$'),
  title text not null check (length(title) between 2 and 200),
  event_date date not null,
  owner_id uuid not null references public.profile (id),
  project_id uuid references public.project (id),
  organization_id uuid references public.organization (id),
  created_by uuid not null references public.profile (id),
  created_at timestamptz not null default now()
);
create index work_process_created_idx on public.work_process (created_at desc);

alter table public.work_item add column process_id uuid references public.work_process (id);
alter table public.work_item add column process_phase text not null default '' check (length(process_phase) <= 40);
alter table public.work_item add column process_position integer not null default 0;
create index work_item_process_idx on public.work_item (process_id, process_position) where process_id is not null;

-- Quem não é da coordenação não tira nem muda uma ação de processo.
create or replace function public.guard_work_item_process()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_project_overseer()
     and (new.process_id is distinct from old.process_id or new.process_phase <> old.process_phase or new.process_position <> old.process_position) then
    raise exception 'apenas administração e coordenação alteram o processo da ação' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger work_item_process_guard before update of process_id, process_phase, process_position on public.work_item
  for each row execute function public.guard_work_item_process();

alter table public.work_process enable row level security;
-- Quem recebeu uma ação do processo vê o nome dele (para o "Parte de: …"); o resto é da coordenação.
create policy work_process_select on public.work_process for select to authenticated
  using (public.is_project_overseer() or exists (
    select 1 from public.work_item w where w.process_id = work_process.id and public.is_active_user() and (w.owner_id = auth.uid() or w.approver_id = auth.uid())
  ));
create policy work_process_insert on public.work_process for insert to authenticated
  with check (public.is_project_overseer() and created_by = auth.uid());
create policy work_process_update on public.work_process for update to authenticated
  using (public.is_project_overseer()) with check (public.is_project_overseer());
revoke all on public.work_process from anon;

-- Cria o processo, as ações e os passos numa transação só (RLS do usuário vale: security invoker).
create or replace function public.create_work_process(p_process jsonb, p_items jsonb)
returns uuid
language plpgsql security invoker set search_path = public
as $$
declare
  pid uuid;
  it jsonb;
  wid uuid;
  step text;
  pos integer := 0;
  spos integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 60 then
    raise exception 'processo precisa de 1 a 60 ações' using errcode = '23514';
  end if;
  insert into public.work_process (template, title, event_date, owner_id, project_id, organization_id, created_by)
  values (
    p_process ->> 'template', p_process ->> 'title', (p_process ->> 'event_date')::date, (p_process ->> 'owner_id')::uuid,
    nullif(p_process ->> 'project_id', '')::uuid, nullif(p_process ->> 'organization_id', '')::uuid, auth.uid()
  )
  returning id into pid;

  for it in select value from jsonb_array_elements(p_items) loop
    pos := pos + 1;
    insert into public.work_item (
      title, description, kind, priority, owner_id, approver_id, due_at, project_id, organization_id,
      process_id, process_phase, process_position, created_by, updated_by
    ) values (
      it ->> 'title', coalesce(it ->> 'description', ''), coalesce(it ->> 'kind', 'action')::public.work_item_kind,
      coalesce(it ->> 'priority', 'medium')::public.mission_priority,
      coalesce(nullif(it ->> 'owner_id', '')::uuid, (p_process ->> 'owner_id')::uuid), nullif(it ->> 'approver_id', '')::uuid,
      nullif(it ->> 'due_at', '')::timestamptz, nullif(p_process ->> 'project_id', '')::uuid, nullif(p_process ->> 'organization_id', '')::uuid,
      pid, coalesce(it ->> 'phase', ''), pos, auth.uid(), auth.uid()
    )
    returning id into wid;
    spos := 0;
    for step in select jsonb_array_elements_text(coalesce(it -> 'checklist', '[]'::jsonb)) loop
      spos := spos + 1;
      insert into public.work_item_checklist_item (item_id, label, position, created_by) values (wid, step, spos, auth.uid());
    end loop;
  end loop;
  return pid;
end $$;
revoke all on function public.create_work_process(jsonb, jsonb) from public, anon;
grant execute on function public.create_work_process(jsonb, jsonb) to authenticated;

-- ─── E-mails das ações ─────────────────────────────────────────────────────
alter table public.mail_outbox drop constraint mail_outbox_template_check;
alter table public.mail_outbox add constraint mail_outbox_template_check check (template in (
  'challenge_received', 'content_review_requested', 'content_decided', 'content_published', 'membership_granted',
  'work_item_assigned', 'work_item_approval_requested', 'work_item_changes_requested', 'work_item_mentioned',
  'work_item_due_soon', 'work_item_overdue', 'work_process_created'
));

create or replace function public.display_name_of(p_profile uuid)
returns text language sql stable security definer set search_path = public as $$
  select coalesce(nullif(p.full_name, ''), p.email, '') from public.profile p where p.id = p_profile
$$;
revoke all on function public.display_name_of(uuid) from public, anon, authenticated;

create or replace function public.mail_on_work_item()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base jsonb := jsonb_build_object('itemId', new.id::text, 'title', new.title, 'dueAt', coalesce(new.due_at::text, ''), 'actor', coalesce(public.display_name_of(auth.uid()), ''));
  note text;
begin
  -- recebeu a ação (itens de processo avisam uma vez só, pelo processo)
  if new.owner_id is not null and new.owner_id is distinct from auth.uid() and new.process_id is null
     and (tg_op = 'INSERT' or new.owner_id is distinct from old.owner_id) then
    perform public.enqueue_mail_to_profile('work_item_assigned', new.owner_id, 'work_item', new.id::text, base);
  end if;
  -- pediram aprovação
  if new.status = 'awaiting_approval' and new.approver_id is distinct from auth.uid()
     and (tg_op = 'INSERT' or old.status <> 'awaiting_approval') then
    perform public.enqueue_mail_to_profile('work_item_approval_requested', new.approver_id, 'work_item', new.id::text, base);
  end if;
  -- pediram alteração
  if tg_op = 'UPDATE' and old.status = 'awaiting_approval' and new.status = 'in_progress' and new.owner_id is distinct from auth.uid() then
    select e.note into note from public.work_item_event e where e.item_id = new.id and e.kind = 'changes_requested' order by e.id desc limit 1;
    perform public.enqueue_mail_to_profile('work_item_changes_requested', new.owner_id, 'work_item', new.id::text, base || jsonb_build_object('note', coalesce(note, '')));
  end if;
  return new;
end $$;
create trigger work_item_mail after insert or update of owner_id, status on public.work_item
  for each row execute function public.mail_on_work_item();

create or replace function public.mail_on_work_item_mention()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  m uuid;
  t text;
begin
  select w.title into t from public.work_item w where w.id = new.item_id;
  foreach m in array new.mentions loop
    if m <> new.author_id then
      perform public.enqueue_mail_to_profile('work_item_mentioned', m, 'work_item', new.item_id::text,
        jsonb_build_object('itemId', new.item_id::text, 'title', coalesce(t, ''), 'actor', coalesce(public.display_name_of(new.author_id), '')));
    end if;
  end loop;
  return new;
end $$;
create trigger work_item_comment_mail after insert on public.work_item_comment
  for each row execute function public.mail_on_work_item_mention();

create or replace function public.mail_on_work_process()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.owner_id is distinct from auth.uid() then
    perform public.enqueue_mail_to_profile('work_process_created', new.owner_id, 'work_process', new.id::text,
      jsonb_build_object('processId', new.id::text, 'title', new.title, 'eventDate', new.event_date::text, 'actor', coalesce(public.display_name_of(auth.uid()), '')));
  end if;
  return new;
end $$;
create trigger work_process_mail after insert on public.work_process
  for each row execute function public.mail_on_work_process();

-- ─── Lembretes de prazo (cron do /api/mail/dispatch) ───────────────────────
-- Um lembrete por prazo: mudar o prazo permite um novo; nunca repete o mesmo.
create table public.work_item_reminder (
  item_id uuid not null references public.work_item (id) on delete cascade,
  kind text not null check (kind in ('due_soon', 'overdue')),
  due_at timestamptz not null,
  sent_at timestamptz not null default now(),
  primary key (item_id, kind, due_at)
);
alter table public.work_item_reminder enable row level security;
revoke all on public.work_item_reminder from anon, authenticated;

create or replace function public.enqueue_work_item_reminders()
returns integer
language plpgsql security definer set search_path = public as $$
declare
  r record;
  n integer := 0;
  k text;
begin
  for r in
    select w.id, w.owner_id, w.title, w.due_at,
           case when w.due_at < now() then 'overdue' else 'due_soon' end as kind
      from public.work_item w
     where w.owner_id is not null and w.due_at is not null
       and w.status in ('planned', 'in_progress', 'blocked')
       and (w.snoozed_until is null or w.snoozed_until <= now())
       and w.due_at < now() + interval '24 hours'
       and w.due_at > now() - interval '7 days'
  loop
    k := r.kind;
    insert into public.work_item_reminder (item_id, kind, due_at) values (r.id, k, r.due_at) on conflict do nothing;
    if found then
      perform public.enqueue_mail_to_profile(case when k = 'overdue' then 'work_item_overdue' else 'work_item_due_soon' end, r.owner_id, 'work_item', r.id::text,
        jsonb_build_object('itemId', r.id::text, 'title', r.title, 'dueAt', r.due_at::text));
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;
revoke all on function public.enqueue_work_item_reminders() from public, anon, authenticated;
grant execute on function public.enqueue_work_item_reminders() to service_role;
