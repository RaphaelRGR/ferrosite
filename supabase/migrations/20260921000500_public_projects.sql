-- PROJ-001 — Projetos reais no site (04/17/18). Um projeto vai ao site quando a
-- coordenação/liderança o classifica como `public` e ele não está em rascunho,
-- cancelado ou arquivado. O site lê só a projeção `public_project` (campos
-- públicos + descrição em Markdown restrito) e recebe capa/galeria pelo proxy,
-- sob as mesmas regras dos demais arquivos (verificado, público, consentimento).

alter table public.project add column description_md text not null default '' check (length(description_md) <= 20000);
alter table public.project add column description_md_en text not null default '' check (length(description_md_en) <= 20000);

create view public.public_project with (security_invoker = false) as
  select p.id, p.slug, p.name, p.name_en, p.summary, p.summary_en, p.description_md, p.description_md_en,
         p.category, p.status, p.starts_on, p.ends_on, p.updated_at,
         (select pf.file_id from public.project_file pf join public.file_asset f on f.id = pf.file_id
           where pf.project_id = p.id and pf.kind = 'cover' and f.status = 'verified' and f.classification = 'public' and f.consent in ('granted', 'not_required')
           limit 1) as cover_file_id
    from public.project p
   where p.classification = 'public' and p.status::text in ('planned', 'active', 'paused', 'completed');
grant select on public.public_project to anon, authenticated;

-- Galeria pública do projeto: arquivos vinculados como galeria/capa, verificados, públicos, com consentimento.
create or replace function public.public_project_gallery(p_slug text)
returns table (file_id uuid, alt_text text, alt_text_en text, credit text, kind public.file_link_kind, sort_order integer)
language sql stable security definer set search_path = public as $$
  select f.id, f.alt_text, f.alt_text_en, f.credit, pf.kind, pf.position
    from public.project p
    join public.project_file pf on pf.project_id = p.id and pf.kind in ('cover', 'gallery')
    join public.file_asset f on f.id = pf.file_id
    join public.file_type_allowlist a on a.mime_type = f.mime_type and a.gallery
   where p.slug = p_slug and p.classification = 'public' and p.status::text in ('planned', 'active', 'paused', 'completed')
     and f.status = 'verified' and f.classification = 'public' and f.consent in ('granted', 'not_required')
   order by pf.kind = 'cover' desc, pf.position, pf.linked_at
$$;
revoke all on function public.public_project_gallery(text) from public;
grant execute on function public.public_project_gallery(text) to anon, authenticated, service_role;

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
     and (
       exists (select 1 from public.publication p where (p.cover_file_id = f.id or f.id = any (p.gallery_file_ids)) and p.unpublished_at is null and p.published_at <= now())
       or exists (select 1 from public.site_image s where s.file_id = f.id)
       or exists (select 1 from public.project_file pf join public.project p on p.id = pf.project_id
                   where pf.file_id = f.id and pf.kind in ('cover', 'gallery') and p.classification = 'public' and p.status::text in ('planned', 'active', 'paused', 'completed'))
     )
$$;

revoke all on all tables in schema public from anon;
grant select on public.public_publication to anon, authenticated;
grant select on public.public_project to anon, authenticated;
