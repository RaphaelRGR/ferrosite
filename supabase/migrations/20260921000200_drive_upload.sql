-- DRIVE-003 — Upload pelo Portal para o Drive institucional (17/21).
-- O Portal cria subpastas sob demanda dentro da pasta raiz (estrutura por
-- entidade: projetos/<slug>/{galeria,documentos,tecnico,missoes}, conteudos/,
-- visitas/, relatorios/, comunicacao/, acervo-historico/) e envia bytes pelo
-- servidor após validar tipo por magic bytes e tamanho pela allowlist.
-- Nada é movido nem apagado no Drive pelo Portal.

-- Allowlist: quais tipos podem SUBIR (uploadable) além de serem registrados.
-- ZIP e vídeo continuam só registráveis até haver varredura antimalware (decisão 33).
alter table public.file_type_allowlist add column uploadable boolean not null default false;
alter table public.file_type_allowlist add column extension text not null default '';
update public.file_type_allowlist set uploadable = true, extension = case mime_type
  when 'image/jpeg' then 'jpg' when 'image/png' then 'png' when 'image/webp' then 'webp' when 'application/pdf' then 'pdf' end
  where mime_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf');
update public.file_type_allowlist set extension = 'mp4' where mime_type = 'video/mp4';
insert into public.file_type_allowlist (mime_type, max_bytes, gallery, uploadable, extension) values
  ('model/stl', 100 * 1024 * 1024, false, true, 'stl'),
  ('application/dxf', 50 * 1024 * 1024, false, true, 'dxf'),
  ('image/vnd.dwg', 100 * 1024 * 1024, false, true, 'dwg'),
  ('application/sldworks', 200 * 1024 * 1024, false, true, 'sldprt'),
  ('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 50 * 1024 * 1024, false, true, 'docx'),
  ('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 50 * 1024 * 1024, false, true, 'xlsx'),
  ('application/vnd.openxmlformats-officedocument.presentationml.presentation', 100 * 1024 * 1024, false, true, 'pptx');

-- Onde o arquivo vive dentro da raiz (caminho lógico) e a pasta do Drive.
alter table public.file_asset add column storage_path text not null default '';
alter table public.file_asset add column drive_folder_id text not null default '';
create index file_asset_storage_path_idx on public.file_asset (storage_path) where storage_path <> '';

-- Cache das subpastas criadas pelo Portal (caminho lógico → id no Drive). Só service role.
create table public.drive_folder (
  path text primary key check (path ~ '^[a-z0-9-]+(/[a-z0-9-]+)*$'),
  drive_id text not null check (length(drive_id) between 10 and 128),
  created_by uuid references public.profile (id),
  created_at timestamptz not null default now()
);
alter table public.drive_folder enable row level security;
revoke all on public.drive_folder from anon, authenticated;

-- Upload = registro já verificado pelo provedor: auditar como tal (guard de INSERT).
create or replace function public.audit_file_upload()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'verified' and new.storage_path <> '' then
    new.verified_at := coalesce(new.verified_at, now());
    new.verified_by := coalesce(new.verified_by, auth.uid());
    perform public.log_audit('file.uploaded', 'file_asset', new.id::text, 'ok',
      jsonb_build_object('path', new.storage_path, 'mime', new.mime_type, 'size', new.size_bytes, 'hash', new.content_hash));
  end if;
  return new;
end $$;
create trigger file_asset_upload_audit before insert on public.file_asset for each row execute function public.audit_file_upload();

revoke all on all tables in schema public from anon;
grant select on public.public_publication to anon, authenticated;
