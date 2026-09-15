-- PUB-001 — Portal produz, site comunica (18). Conteúdo interno → revisões → aprovação →
-- publicação como SNAPSHOT em projeção pública separada. O site lê só a projeção
-- (view para anon), nunca tabelas internas. PT e EN têm itens/estados próprios.

create type public.content_type as enum ('news', 'event', 'project_update', 'experience', 'partner_case', 'lab_case');
create type public.content_status as enum ('draft', 'review', 'changes_requested', 'approved', 'scheduled', 'published', 'unpublished', 'archived');
create type public.approval_decision as enum ('pending', 'approved', 'changes_requested');

create table public.content_item (
  id uuid primary key default gen_random_uuid(),
  type public.content_type not null,
  locale text not null check (locale in ('pt', 'en')),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(title) between 2 and 200),
  summary text not null default '' check (length(summary) <= 500),
  -- Markdown restrito (subconjunto sem HTML); renderizado e escapado no servidor.
  body_md text not null default '' check (length(body_md) <= 20000),
  event_at timestamptz,
  event_place text not null default '',
  project_id uuid references public.project (id),
  organization_id uuid references public.organization (id),
  cover_file_id uuid references public.file_asset (id),
  -- Fonte e consentimento (18: registro por publicação).
  source_note text not null default '',
  consent_confirmed boolean not null default false,
  status public.content_status not null default 'draft',
  scheduled_for timestamptz,
  -- token de pré-visualização: hash de dois UUIDs aleatórios (RNG forte, sem pgcrypto)
  preview_token text not null default encode(sha256(convert_to(gen_random_uuid()::text || gen_random_uuid()::text, 'UTF8')), 'hex'),
  author_id uuid not null references public.profile (id),
  updated_by uuid not null references public.profile (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  unique (type, locale, slug)
);
create index content_item_status_idx on public.content_item (status, type);

create table public.content_revision (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.content_item (id) on delete cascade,
  revision_no integer not null,
  snapshot jsonb not null,
  note text not null default '',
  author_id uuid not null references public.profile (id),
  created_at timestamptz not null default now(),
  unique (item_id, revision_no)
);

create table public.approval_request (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.content_item (id) on delete cascade,
  revision_id uuid not null references public.content_revision (id),
  requested_by uuid not null references public.profile (id),
  reviewer_id uuid references public.profile (id),
  decision public.approval_decision not null default 'pending',
  comment text not null default '',
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index approval_request_item_idx on public.approval_request (item_id, created_at desc);

-- Projeção pública: snapshot sanitizado por locale. Uma linha viva por item.
create table public.publication (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.content_item (id) on delete cascade,
  revision_id uuid not null references public.content_revision (id),
  type public.content_type not null,
  locale text not null,
  slug text not null,
  title text not null,
  summary text not null,
  body_md text not null,
  event_at timestamptz,
  event_place text not null default '',
  cover_alt text not null default '',
  cover_credit text not null default '',
  published_at timestamptz not null default now(),
  published_by uuid not null references public.profile (id),
  unpublished_at timestamptz,
  unpublished_by uuid references public.profile (id)
);
create index publication_live_idx on public.publication (type, locale, published_at desc) where unpublished_at is null;
create unique index publication_live_slug on public.publication (type, locale, slug) where unpublished_at is null;

create trigger content_item_touch before update on public.content_item for each row execute function public.touch_updated_at();

-- ─── Fluxo (18): rascunho → revisão → alterações solicitadas/revisado → aprovado → agendado/publicado → despublicado/arquivado
create or replace function public.guard_content_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  o text := old.status::text;
  n text := new.status::text;
  allowed boolean;
  content_changed boolean;
begin
  content_changed := new.title is distinct from old.title or new.summary is distinct from old.summary or new.body_md is distinct from old.body_md
    or new.event_at is distinct from old.event_at or new.event_place is distinct from old.event_place or new.cover_file_id is distinct from old.cover_file_id
    or new.slug is distinct from old.slug;
  -- Editar conteúdo aprovado/publicado invalida a aprovação: volta a rascunho (18: sem alteração retroativa).
  if content_changed and o in ('approved', 'scheduled', 'published') and o = n then
    new.status := 'draft';
    n := 'draft';
  end if;
  if o = n then
    return new;
  end if;
  allowed := case o
    when 'draft'              then n in ('review', 'archived')
    when 'review'             then n in ('approved', 'changes_requested', 'draft', 'archived')
    when 'changes_requested'  then n in ('draft', 'review', 'archived')
    when 'approved'           then n in ('scheduled', 'published', 'draft', 'archived')
    when 'scheduled'          then n in ('published', 'approved', 'draft', 'archived')
    when 'published'          then n in ('unpublished', 'draft')
    when 'unpublished'        then n in ('draft', 'published', 'archived')
    when 'archived'           then n in ('draft')
    else false
  end;
  if not allowed then
    raise exception 'transição de conteúdo inválida: % → %', o, n using errcode = '23514';
  end if;
  if n = 'scheduled' and new.scheduled_for is null then
    raise exception 'agendamento exige data/hora' using errcode = '23514';
  end if;
  -- Aprovar/publicar/despublicar: só aprovadores (admin/coordenação) e nunca o próprio autor aprova (18).
  if n in ('approved', 'published', 'scheduled', 'unpublished') and auth.uid() is not null then
    if not public.has_global_role('admin', 'coordination') then
      raise exception 'aprovação e publicação são da coordenação/administração' using errcode = '42501';
    end if;
    if n = 'approved' and new.author_id = auth.uid() then
      raise exception 'autor não aprova o próprio conteúdo' using errcode = '42501';
    end if;
  end if;
  if n in ('review', 'approved', 'published') and not new.consent_confirmed and new.cover_file_id is not null then
    raise exception 'capa exige consentimento confirmado antes de revisar/publicar' using errcode = '23514';
  end if;
  perform public.log_audit('content.' || n, 'content_item', new.id::text, 'ok', jsonb_build_object('from', o, 'locale', new.locale, 'type', new.type));
  return new;
end $$;
create trigger content_status before update on public.content_item for each row execute function public.guard_content_status();
create trigger content_no_delete before delete on public.content_item for each row execute function public.forbid_delete();

-- Cada mudança de conteúdo gera uma revisão imutável (snapshot) — insert também.
create or replace function public.snapshot_content()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  next_no integer;
begin
  if tg_op = 'UPDATE' and new.title = old.title and new.summary = old.summary and new.body_md = old.body_md
     and new.event_at is not distinct from old.event_at and new.event_place = old.event_place
     and new.cover_file_id is not distinct from old.cover_file_id and new.slug = old.slug then
    return new;
  end if;
  select coalesce(max(revision_no), 0) + 1 into next_no from public.content_revision where item_id = new.id;
  insert into public.content_revision (item_id, revision_no, snapshot, author_id)
  values (new.id, next_no, jsonb_build_object(
    'title', new.title, 'summary', new.summary, 'body_md', new.body_md, 'event_at', new.event_at, 'event_place', new.event_place,
    'cover_file_id', new.cover_file_id, 'slug', new.slug, 'locale', new.locale, 'type', new.type
  ), coalesce(auth.uid(), new.updated_by));
  return new;
end $$;
create trigger content_snapshot after insert or update on public.content_item for each row execute function public.snapshot_content();

-- Publicar = copiar a revisão aprovada para a projeção (snapshot); despublicar = marcar; rollback = publicar revisão anterior.
create or replace function public.publish_content(p_item uuid, p_revision uuid default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  it public.content_item%rowtype;
  rev public.content_revision%rowtype;
  cover public.file_asset%rowtype;
  pub_id uuid;
begin
  if not public.has_global_role('admin', 'coordination') then
    raise exception 'publicação é da coordenação/administração' using errcode = '42501';
  end if;
  select * into it from public.content_item where id = p_item for update;
  if it.id is null then
    raise exception 'conteúdo não encontrado' using errcode = 'P0002';
  end if;
  if p_revision is null then
    if it.status not in ('approved', 'scheduled', 'unpublished') then
      raise exception 'só conteúdo aprovado pode ser publicado (situação atual: %)', it.status using errcode = '23514';
    end if;
    select * into rev from public.content_revision where item_id = p_item order by revision_no desc limit 1;
  else
    -- rollback explícito para uma revisão anterior já publicada alguma vez
    select * into rev from public.content_revision where id = p_revision and item_id = p_item;
    if rev.id is null or not exists (select 1 from public.publication where revision_id = p_revision) then
      raise exception 'rollback só para revisão já publicada' using errcode = '23514';
    end if;
  end if;
  if (rev.snapshot ->> 'cover_file_id') is not null then
    select * into cover from public.file_asset where id = (rev.snapshot ->> 'cover_file_id')::uuid;
    if cover.consent <> 'granted' and cover.consent <> 'not_required' then
      raise exception 'capa sem consentimento não pode ser publicada' using errcode = '23514';
    end if;
  end if;
  update public.publication set unpublished_at = now(), unpublished_by = auth.uid()
  where item_id = p_item and unpublished_at is null;
  insert into public.publication (item_id, revision_id, type, locale, slug, title, summary, body_md, event_at, event_place, cover_alt, cover_credit, published_by)
  values (p_item, rev.id, it.type, it.locale, rev.snapshot ->> 'slug', rev.snapshot ->> 'title', coalesce(rev.snapshot ->> 'summary', ''), coalesce(rev.snapshot ->> 'body_md', ''),
          nullif(rev.snapshot ->> 'event_at', '')::timestamptz, coalesce(rev.snapshot ->> 'event_place', ''),
          coalesce(cover.alt_text, ''), coalesce(cover.credit, ''), auth.uid())
  returning id into pub_id;
  update public.content_item set status = 'published', updated_by = auth.uid() where id = p_item and status <> 'published';
  perform public.log_audit('publication.published', 'publication', pub_id::text, 'ok', jsonb_build_object('item', p_item, 'revision', rev.revision_no, 'rollback', p_revision is not null));
  return pub_id;
end $$;

create or replace function public.unpublish_content(p_item uuid, p_reason text default '')
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.has_global_role('admin', 'coordination') then
    raise exception 'despublicação é da coordenação/administração' using errcode = '42501';
  end if;
  update public.publication set unpublished_at = now(), unpublished_by = auth.uid()
  where item_id = p_item and unpublished_at is null;
  update public.content_item set status = 'unpublished', updated_by = auth.uid() where id = p_item and status = 'published';
  perform public.log_audit('publication.unpublished', 'content_item', p_item::text, 'ok', jsonb_build_object('reason', p_reason));
end $$;

revoke all on function public.publish_content(uuid, uuid) from public, anon;
revoke all on function public.unpublish_content(uuid, text) from public, anon;
grant execute on function public.publish_content(uuid, uuid) to authenticated;
grant execute on function public.unpublish_content(uuid, text) to authenticated;

-- ─── Projeção pública lida pelo site (anon): só linhas vivas e campos públicos ──
create view public.public_publication with (security_invoker = false) as
  select id, type, locale, slug, title, summary, body_md, event_at, event_place, cover_alt, cover_credit, published_at
  from public.publication
  where unpublished_at is null and published_at <= now();

-- Pré-visualização por token (não indexável): resolvida por função, só devolve o item do token.
create or replace function public.preview_content(p_token text)
returns table (id uuid, type public.content_type, locale text, slug text, title text, summary text, body_md text, event_at timestamptz, event_place text, status public.content_status)
language sql stable security definer set search_path = public
as $$
  select c.id, c.type, c.locale, c.slug, c.title, c.summary, c.body_md, c.event_at, c.event_place, c.status
  from public.content_item c
  where c.preview_token = p_token and length(p_token) >= 24 and c.status <> 'archived'
$$;
revoke all on function public.preview_content(text) from public, anon, authenticated;
grant execute on function public.preview_content(text) to service_role;

-- ─── RLS ───────────────────────────────────────────────────────────────────
alter table public.content_item enable row level security;
alter table public.content_revision enable row level security;
alter table public.approval_request enable row level security;
alter table public.publication enable row level security;

-- Autores: membros ativos criam/editam os próprios rascunhos; overseers tudo; membros do projeto veem os do projeto.
create policy content_select on public.content_item for select to authenticated
  using (public.is_project_overseer() or author_id = auth.uid() or (project_id is not null and public.is_project_member(project_id)));
create policy content_insert on public.content_item for insert to authenticated
  with check (public.is_active_user() and author_id = auth.uid() and updated_by = auth.uid()
    and (project_id is null or public.is_project_overseer() or public.project_role_of(project_id) in ('leader', 'member')));
create policy content_update on public.content_item for update to authenticated
  using (public.is_project_overseer() or (author_id = auth.uid() and status in ('draft', 'changes_requested', 'review')))
  with check (updated_by = auth.uid());

create policy revision_select on public.content_revision for select to authenticated
  using (exists (select 1 from public.content_item c where c.id = item_id and (public.is_project_overseer() or c.author_id = auth.uid() or (c.project_id is not null and public.is_project_member(c.project_id)))));

create policy approval_select on public.approval_request for select to authenticated
  using (public.is_project_overseer() or requested_by = auth.uid());
create policy approval_insert on public.approval_request for insert to authenticated
  with check (requested_by = auth.uid() and exists (select 1 from public.content_item c where c.id = item_id and (c.author_id = auth.uid() or public.is_project_overseer())));
create policy approval_update on public.approval_request for update to authenticated
  using (public.is_project_overseer()) with check (public.is_project_overseer() and reviewer_id = auth.uid());

create policy publication_select on public.publication for select to authenticated
  using (public.is_project_overseer() or exists (select 1 from public.content_item c where c.id = item_id and c.author_id = auth.uid()));

revoke all on all tables in schema public from anon;
grant select on public.public_publication to anon, authenticated;
