-- ACT-003: checklist, menções e vínculo coerente com missão/projeto.
-- Continua privado: menção só alcança quem já pode ver a ação (admin/coordenação,
-- responsável ou aprovador); mencionar não dá acesso a ninguém.

-- ─── Quem pode ver uma ação (para um perfil qualquer, não só o usuário atual) ──
create or replace function public.profile_can_view_work_item(p_item uuid, p_profile uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.work_item w join public.profile p on p.id = p_profile
    where w.id = p_item and p.status = 'active'
      and (p.global_role in ('admin', 'coordination') or w.owner_id = p.id or w.approver_id = p.id)
  )
$$;

-- ─── Checklist ─────────────────────────────────────────────────────────────
create table public.work_item_checklist_item (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.work_item (id) on delete cascade,
  label text not null check (length(trim(label)) between 1 and 300),
  done boolean not null default false,
  position integer not null default 0,
  created_by uuid not null references public.profile (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index work_item_checklist_item_idx on public.work_item_checklist_item (item_id, position);
create trigger work_item_checklist_touch before update on public.work_item_checklist_item for each row execute function public.touch_updated_at();

-- Concluir um passo vai para o histórico (desmarcar não: evita ruído).
create or replace function public.log_work_item_checklist()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.done and not old.done then
    perform public.log_work_item(new.item_id, 'checklist_done', null, null, new.label);
  end if;
  return new;
end $$;
create trigger work_item_checklist_log after update of done on public.work_item_checklist_item
  for each row execute function public.log_work_item_checklist();

-- Quem mexe no checklist: admin/coordenação ou o responsável pela ação.
create or replace function public.can_work_on_item(p_item uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.work_item w
    where w.id = p_item and (public.is_project_overseer() or (public.is_active_user() and w.owner_id = auth.uid()))
  )
$$;

alter table public.work_item_checklist_item enable row level security;
create policy work_item_checklist_select on public.work_item_checklist_item for select to authenticated
  using (public.can_view_work_item(item_id));
create policy work_item_checklist_insert on public.work_item_checklist_item for insert to authenticated
  with check (created_by = auth.uid() and public.can_work_on_item(item_id));
create policy work_item_checklist_update on public.work_item_checklist_item for update to authenticated
  using (public.can_work_on_item(item_id)) with check (public.can_work_on_item(item_id));
create policy work_item_checklist_delete on public.work_item_checklist_item for delete to authenticated
  using (public.can_work_on_item(item_id));

-- ─── Menções nos comentários ───────────────────────────────────────────────
alter table public.work_item_comment add column mentions uuid[] not null default '{}';
alter table public.work_item_comment add constraint work_item_comment_mentions_max check (coalesce(array_length(mentions, 1), 0) <= 10);
create index work_item_comment_mentions_idx on public.work_item_comment using gin (mentions);

create or replace function public.guard_work_item_mentions()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  m uuid;
begin
  foreach m in array new.mentions loop
    if not public.profile_can_view_work_item(new.item_id, m) then
      raise exception 'só dá para mencionar quem já participa desta ação' using errcode = '23514';
    end if;
  end loop;
  new.mentions := array(select distinct unnest(new.mentions));
  return new;
end $$;
create trigger work_item_comment_mentions before insert on public.work_item_comment
  for each row execute function public.guard_work_item_mentions();

-- ─── Missão e projeto coerentes ────────────────────────────────────────────
-- Ação ligada a uma missão pertence ao projeto da missão.
create or replace function public.guard_work_item_mission()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  pid uuid;
begin
  if new.mission_id is null then
    return new;
  end if;
  select m.project_id into pid from public.mission m where m.id = new.mission_id;
  if new.project_id is null then
    new.project_id := pid;
  elsif new.project_id <> pid then
    raise exception 'a missão escolhida é de outro projeto' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger work_item_mission_guard before insert or update of mission_id, project_id on public.work_item
  for each row execute function public.guard_work_item_mission();

revoke all on public.work_item_checklist_item from anon;
