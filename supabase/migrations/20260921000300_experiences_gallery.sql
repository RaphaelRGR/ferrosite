-- DRIVE-004 — Experiências reais (visitas técnicas, palestras, eventos) com
-- galeria a partir do acervo (17/18/21). Um conteúdo pode ter vários arquivos
-- vinculados (galeria/anexo); a publicação congela a lista de ids da galeria
-- (snapshot, como os demais campos) e o site só recebe os arquivos que,
-- além de estarem na galeria de uma publicação viva, são verificados,
-- públicos e com consentimento — decidido por `public_file_info`.

create table public.content_file (
  item_id uuid not null references public.content_item (id) on delete cascade,
  file_id uuid not null references public.file_asset (id) on delete cascade,
  kind public.file_link_kind not null default 'gallery',
  position integer not null default 0,
  caption text not null default '' check (length(caption) <= 300),
  linked_by uuid not null references public.profile (id),
  linked_at timestamptz not null default now(),
  primary key (item_id, file_id)
);
create index content_file_item_idx on public.content_file (item_id, position);

alter table public.content_file enable row level security;
-- vê quem vê o conteúdo; vincula/desvincula quem pode editar o conteúdo e vê o arquivo
create policy content_file_select on public.content_file for select to authenticated
  using (exists (select 1 from public.content_item c where c.id = item_id and (public.is_project_overseer() or c.author_id = auth.uid() or (c.project_id is not null and public.is_project_member(c.project_id)))));
create policy content_file_insert on public.content_file for insert to authenticated
  with check (linked_by = auth.uid() and public.can_view_file(file_id)
    and exists (select 1 from public.content_item c where c.id = item_id and (public.is_project_overseer() or (c.author_id = auth.uid() and c.status in ('draft', 'changes_requested', 'review')))));
create policy content_file_update on public.content_file for update to authenticated
  using (exists (select 1 from public.content_item c where c.id = item_id and (public.is_project_overseer() or c.author_id = auth.uid())))
  with check (exists (select 1 from public.content_item c where c.id = item_id and (public.is_project_overseer() or c.author_id = auth.uid())));
create policy content_file_delete on public.content_file for delete to authenticated
  using (exists (select 1 from public.content_item c where c.id = item_id and (public.is_project_overseer() or (c.author_id = auth.uid() and c.status in ('draft', 'changes_requested', 'review')))));

-- Alterar a galeria de conteúdo aprovado/publicado invalida a aprovação (18): volta a rascunho.
create or replace function public.content_file_touch_item()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  iid uuid := coalesce(new.item_id, old.item_id);
begin
  update public.content_item set status = 'draft', updated_by = coalesce(auth.uid(), updated_by)
   where id = iid and status in ('approved', 'scheduled', 'published');
  return coalesce(new, old);
end $$;
create trigger content_file_touch after insert or update or delete on public.content_file
  for each row execute function public.content_file_touch_item();

-- Publicação congela a galeria (ids) — snapshot como os outros campos.
alter table public.publication add column gallery_file_ids uuid[] not null default '{}';

create or replace function public.publish_content(p_item uuid, p_revision uuid default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  it public.content_item%rowtype;
  rev public.content_revision%rowtype;
  cover public.file_asset%rowtype;
  pub_id uuid;
  gallery uuid[];
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
  -- galeria: só arquivos com consentimento entram no snapshot publicado (os demais ficam internos)
  select coalesce(array_agg(cf.file_id order by cf.position, cf.linked_at), '{}')
    into gallery
    from public.content_file cf join public.file_asset f on f.id = cf.file_id
   where cf.item_id = p_item and cf.kind = 'gallery' and f.consent in ('granted', 'not_required') and f.status = 'verified';
  update public.publication set unpublished_at = now(), unpublished_by = auth.uid()
  where item_id = p_item and unpublished_at is null;
  insert into public.publication (item_id, revision_id, type, locale, slug, title, summary, body_md, event_at, event_place, cover_alt, cover_credit, cover_file_id, gallery_file_ids, published_by)
  values (p_item, rev.id, it.type, it.locale, rev.snapshot ->> 'slug', rev.snapshot ->> 'title', coalesce(rev.snapshot ->> 'summary', ''), coalesce(rev.snapshot ->> 'body_md', ''),
          nullif(rev.snapshot ->> 'event_at', '')::timestamptz, coalesce(rev.snapshot ->> 'event_place', ''),
          coalesce(cover.alt_text, ''), coalesce(cover.credit, ''), cover.id, gallery, auth.uid())
  returning id into pub_id;
  update public.content_item set status = 'published', updated_by = auth.uid() where id = p_item and status <> 'published';
  perform public.log_audit('publication.published', 'publication', pub_id::text, 'ok', jsonb_build_object('item', p_item, 'revision', rev.revision_no, 'rollback', p_revision is not null, 'gallery', coalesce(array_length(gallery, 1), 0)));
  return pub_id;
end $$;

create or replace view public.public_publication with (security_invoker = false) as
  select id, type, locale, slug, title, summary, body_md, event_at, event_place, cover_alt, cover_credit, published_at, cover_file_id, gallery_file_ids
  from public.publication
  where unpublished_at is null and published_at <= now();

-- Site: capa OU item da galeria de uma publicação viva, verificado, público, com consentimento, tipo de galeria.
create or replace function public.public_file_info(p_file uuid)
returns table (external_id text, mime_type text, name text, size_bytes bigint, content_hash text)
language sql stable security definer set search_path = public as $$
  select f.external_id, f.mime_type, f.name, f.size_bytes, f.content_hash
    from public.file_asset f
    join public.file_type_allowlist a on a.mime_type = f.mime_type and a.gallery
   where f.id = p_file
     and f.provider = 'google_drive'
     and f.status = 'verified'
     and f.classification = 'public'
     and f.consent in ('granted', 'not_required')
     and exists (
       select 1 from public.publication p
        where (p.cover_file_id = f.id or f.id = any (p.gallery_file_ids)) and p.unpublished_at is null and p.published_at <= now()
     )
$$;

-- Galeria de uma publicação viva com alt/crédito (só o que o site pode servir).
create or replace function public.public_gallery(p_publication uuid)
returns table (file_id uuid, alt_text text, alt_text_en text, credit text, caption text, sort_order integer)
language sql stable security definer set search_path = public as $$
  select f.id, f.alt_text, f.alt_text_en, f.credit, coalesce(cf.caption, ''), coalesce(cf.position, 0)
    from public.publication p
    cross join unnest(p.gallery_file_ids) with ordinality as g(fid, ord)
    join public.file_asset f on f.id = g.fid
    join public.file_type_allowlist a on a.mime_type = f.mime_type and a.gallery
    left join public.content_file cf on cf.item_id = p.item_id and cf.file_id = f.id
   where p.id = p_publication and p.unpublished_at is null and p.published_at <= now()
     and f.status = 'verified' and f.classification = 'public' and f.consent in ('granted', 'not_required')
   order by g.ord
$$;
revoke all on function public.public_gallery(uuid) from public;
grant execute on function public.public_gallery(uuid) to anon, authenticated, service_role;

revoke all on all tables in schema public from anon;
grant select on public.public_publication to anon, authenticated;
