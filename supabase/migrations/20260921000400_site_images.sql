-- DRIVE-004b — Imagens institucionais do site (capa da Home etc.) escolhidas
-- pela coordenação entre arquivos do acervo já verificados, públicos e com
-- consentimento. Chave por posição (`home_hero`); o site resolve pela função
-- pública e serve pelo proxy /api/midia — nunca URL do Drive.

create table public.site_image (
  key text primary key check (key ~ '^[a-z0-9_]{2,40}$'),
  file_id uuid not null references public.file_asset (id),
  updated_by uuid references public.profile (id),
  updated_at timestamptz not null default now()
);
alter table public.site_image enable row level security;
create policy site_image_select on public.site_image for select to authenticated using (public.is_project_overseer());
create policy site_image_write on public.site_image for insert to authenticated with check (public.is_project_overseer() and updated_by = auth.uid());
create policy site_image_update on public.site_image for update to authenticated using (public.is_project_overseer()) with check (public.is_project_overseer() and updated_by = auth.uid());
create policy site_image_delete on public.site_image for delete to authenticated using (public.is_project_overseer());
revoke all on public.site_image from anon;

create or replace function public.audit_site_image()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.log_audit('site_image.' || lower(tg_op), 'site_image', coalesce(new.key, old.key), 'ok',
    jsonb_build_object('file', coalesce(new.file_id, old.file_id)));
  return coalesce(new, old);
end $$;
create trigger site_image_audit after insert or update or delete on public.site_image for each row execute function public.audit_site_image();

-- O site só recebe a imagem se o arquivo cumprir as mesmas condições da capa pública.
create or replace function public.public_site_image(p_key text)
returns table (file_id uuid, alt_text text, alt_text_en text, credit text)
language sql stable security definer set search_path = public as $$
  select f.id, f.alt_text, f.alt_text_en, f.credit
    from public.site_image s
    join public.file_asset f on f.id = s.file_id
    join public.file_type_allowlist a on a.mime_type = f.mime_type and a.gallery
   where s.key = p_key and f.provider = 'google_drive' and f.status = 'verified'
     and f.classification = 'public' and f.consent in ('granted', 'not_required')
$$;
revoke all on function public.public_site_image(text) from public;
grant execute on function public.public_site_image(text) to anon, authenticated, service_role;

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
     )
$$;

revoke all on all tables in schema public from anon;
grant select on public.public_publication to anon, authenticated;
