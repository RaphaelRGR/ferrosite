-- DRIVE-001 — Google Drive como provedor de bytes (17/21): o Portal verifica
-- metadados pela conta de serviço, serve original/miniatura por proxy
-- autenticado e o site só exibe a capa de uma publicação viva, com
-- consentimento, verificada e pública. Nenhuma URL do Drive vai ao público.

alter table public.file_asset add column verified_by uuid references public.profile (id);

-- Verificação auditada (hash e tamanho confirmados no provedor).
create or replace function public.guard_file_asset()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  cap bigint;
begin
  select max_bytes into cap from public.file_type_allowlist where mime_type = new.mime_type;
  if cap is null then
    raise exception 'tipo de arquivo não permitido: %', new.mime_type using errcode = '23514';
  end if;
  if new.size_bytes is not null and new.size_bytes > cap then
    raise exception 'arquivo excede o limite para %: % bytes', new.mime_type, cap using errcode = '23514';
  end if;
  new.name := regexp_replace(new.name, '[\\/\x00-\x1f]', '', 'g');
  if tg_op = 'UPDATE' then
    if new.status = 'archived' and old.status <> 'archived' then
      new.archived_at := now();
    end if;
    if new.status = 'verified' and old.status <> 'verified' then
      new.verified_at := now();
      new.verified_by := auth.uid();
      perform public.log_audit('file.verified', 'file_asset', new.id::text, 'ok', jsonb_build_object('hash', new.content_hash, 'size', new.size_bytes, 'mime', new.mime_type));
    end if;
    -- Trocar o arquivo no provedor invalida a verificação.
    if new.external_id is distinct from old.external_id or new.provider is distinct from old.provider then
      new.status := case when new.status in ('archived', 'revoked') then new.status else 'registered' end;
      new.verified_at := null;
      new.verified_by := null;
    end if;
    if new.status in ('archived', 'revoked') and old.status not in ('archived', 'revoked') then
      perform public.log_audit('file.' || new.status::text, 'file_asset', new.id::text, 'ok', jsonb_build_object('from', old.status));
    end if;
    if new.consent is distinct from old.consent then
      perform public.log_audit('file.consent', 'file_asset', new.id::text, 'ok', jsonb_build_object('from', old.consent, 'to', new.consent));
    end if;
  end if;
  return new;
end $$;

-- A publicação leva a capa (id opaco) para o site montar o proxy público.
alter table public.publication add column cover_file_id uuid references public.file_asset (id);

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
  insert into public.publication (item_id, revision_id, type, locale, slug, title, summary, body_md, event_at, event_place, cover_alt, cover_credit, cover_file_id, published_by)
  values (p_item, rev.id, it.type, it.locale, rev.snapshot ->> 'slug', rev.snapshot ->> 'title', coalesce(rev.snapshot ->> 'summary', ''), coalesce(rev.snapshot ->> 'body_md', ''),
          nullif(rev.snapshot ->> 'event_at', '')::timestamptz, coalesce(rev.snapshot ->> 'event_place', ''),
          coalesce(cover.alt_text, ''), coalesce(cover.credit, ''), cover.id, auth.uid())
  returning id into pub_id;
  update public.content_item set status = 'published', updated_by = auth.uid() where id = p_item and status <> 'published';
  perform public.log_audit('publication.published', 'publication', pub_id::text, 'ok', jsonb_build_object('item', p_item, 'revision', rev.revision_no, 'rollback', p_revision is not null));
  return pub_id;
end $$;

-- Coluna nova ao fim (create or replace view só aceita acrescentar).
create or replace view public.public_publication with (security_invoker = false) as
  select id, type, locale, slug, title, summary, body_md, event_at, event_place, cover_alt, cover_credit, published_at, cover_file_id
  from public.publication
  where unpublished_at is null and published_at <= now();

-- O que o site pode servir de um arquivo: só capa de publicação viva, arquivo
-- verificado, público, com consentimento e de tipo de galeria (imagem).
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
        where p.cover_file_id = f.id and p.unpublished_at is null and p.published_at <= now()
     )
$$;
revoke all on function public.public_file_info(uuid) from public, anon, authenticated;
grant execute on function public.public_file_info(uuid) to service_role;

revoke all on all tables in schema public from anon;
grant select on public.public_publication to anon, authenticated;
