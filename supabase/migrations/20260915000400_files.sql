-- FILE-001 — camada de metadados sobre o acervo (17, 21).
-- O provedor (Drive) guarda os bytes; o Portal guarda metadados, vínculos explícitos,
-- classificação, consentimento e o pedido de publicação. Nenhuma URL pública permanente
-- é armazenada: o acesso passa pelo Portal + provedor (assinado/curto) quando houver credencial.

create type public.file_provider as enum ('google_drive', 'external_link');
create type public.file_status as enum ('registered', 'verified', 'archived', 'revoked');
create type public.file_link_kind as enum ('attachment', 'cover', 'gallery', 'official_document');
create type public.consent_status as enum ('not_required', 'pending', 'granted', 'refused');

create table public.file_asset (
  id uuid primary key default gen_random_uuid(),
  provider public.file_provider not null default 'google_drive',
  -- ID no provedor (Drive fileId) ou URL para external_link; único por provedor.
  external_id text not null check (length(external_id) between 1 and 512),
  name text not null check (length(name) between 1 and 255),
  mime_type text not null default 'application/octet-stream' check (mime_type ~ '^[a-z0-9.+-]+/[a-z0-9.+-]+$'),
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  content_hash text,
  classification public.classification not null default 'internal',
  status public.file_status not null default 'registered',
  -- Crédito/alt para uso em galeria (17); consentimento de pessoas retratadas (21).
  credit text not null default '',
  alt_text text not null default '',
  alt_text_en text not null default '',
  consent public.consent_status not null default 'pending',
  consent_note text not null default '',
  owner_id uuid not null references public.profile (id),
  created_by uuid not null references public.profile (id),
  updated_by uuid not null references public.profile (id),
  verified_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  unique (provider, external_id)
);
create index file_asset_status_idx on public.file_asset (status) where archived_at is null;

-- Vínculos explícitos (17: sem polimorfismo sem integridade).
create table public.project_file (
  project_id uuid not null references public.project (id) on delete cascade,
  file_id uuid not null references public.file_asset (id) on delete cascade,
  kind public.file_link_kind not null default 'attachment',
  position integer not null default 0,
  linked_by uuid not null references public.profile (id),
  linked_at timestamptz not null default now(),
  primary key (project_id, file_id)
);
create table public.mission_file (
  mission_id uuid not null references public.mission (id) on delete cascade,
  file_id uuid not null references public.file_asset (id) on delete cascade,
  kind public.file_link_kind not null default 'attachment',
  linked_by uuid not null references public.profile (id),
  linked_at timestamptz not null default now(),
  primary key (mission_id, file_id)
);

-- Allowlist de tipos aceitos para galeria/documentos (21). Extensível por migration, não por UI.
create table public.file_type_allowlist (
  mime_type text primary key,
  max_bytes bigint not null check (max_bytes > 0),
  gallery boolean not null default false
);
insert into public.file_type_allowlist (mime_type, max_bytes, gallery) values
  ('image/jpeg', 20 * 1024 * 1024, true),
  ('image/png', 20 * 1024 * 1024, true),
  ('image/webp', 20 * 1024 * 1024, true),
  ('application/pdf', 50 * 1024 * 1024, false),
  ('video/mp4', 500 * 1024 * 1024, false);

-- Só um arquivo de capa por projeto.
create unique index project_file_single_cover on public.project_file (project_id) where kind = 'cover';

create trigger file_asset_touch before update on public.file_asset for each row execute function public.touch_updated_at();

-- Guardas: tipo/tamanho na allowlist ao registrar; revogação/arquivamento auditados; sem DELETE físico.
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
  -- nome normalizado: sem caminhos, sem controle
  new.name := regexp_replace(new.name, '[\\/\x00-\x1f]', '', 'g');
  if tg_op = 'UPDATE' then
    if new.status = 'archived' and old.status <> 'archived' then
      new.archived_at := now();
    end if;
    if new.status = 'verified' and old.status <> 'verified' then
      new.verified_at := now();
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
create trigger file_asset_guard before insert or update on public.file_asset for each row execute function public.guard_file_asset();
create trigger file_asset_no_delete before delete on public.file_asset for each row execute function public.forbid_delete();

-- Quem pode ver um arquivo: overseer, dono, ou membro de um projeto/missão ao qual ele está vinculado.
create or replace function public.can_view_file(p_file uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_project_overseer()
    or exists (select 1 from public.file_asset f where f.id = p_file and f.owner_id = auth.uid())
    or exists (select 1 from public.project_file pf where pf.file_id = p_file and public.is_project_member(pf.project_id))
    or exists (select 1 from public.mission_file mf join public.mission m on m.id = mf.mission_id where mf.file_id = p_file and public.is_project_member(m.project_id))
$$;

alter table public.file_asset enable row level security;
alter table public.project_file enable row level security;
alter table public.mission_file enable row level security;
alter table public.file_type_allowlist enable row level security;

-- owner_id direto (não só via função): INSERT … RETURNING avalia a policy de SELECT na linha nova, que a função ainda não enxerga.
create policy file_select on public.file_asset for select to authenticated using (owner_id = auth.uid() or public.can_view_file(id));
create policy file_insert on public.file_asset for insert to authenticated
  with check (public.is_active_user() and owner_id = auth.uid() and created_by = auth.uid() and updated_by = auth.uid());
create policy file_update on public.file_asset for update to authenticated
  using (owner_id = auth.uid() or public.is_project_overseer()) with check (updated_by = auth.uid());

create policy project_file_select on public.project_file for select to authenticated
  using (public.is_project_overseer() or public.is_project_member(project_id));
-- Vincular: qualquer membro vincula arquivo que pode ver (assinando linked_by); alterar/desvincular: overseer, líder ou dono do arquivo.
create policy project_file_insert on public.project_file for insert to authenticated
  with check ((public.is_project_overseer() or public.is_project_member(project_id)) and linked_by = auth.uid() and public.can_view_file(file_id));
create policy project_file_update on public.project_file for update to authenticated
  using (public.is_project_overseer() or public.is_project_leader(project_id) or exists (select 1 from public.file_asset f where f.id = file_id and f.owner_id = auth.uid()))
  with check (public.is_project_overseer() or public.is_project_member(project_id));
create policy project_file_delete on public.project_file for delete to authenticated
  using (public.is_project_overseer() or public.is_project_leader(project_id) or exists (select 1 from public.file_asset f where f.id = file_id and f.owner_id = auth.uid()));

create policy mission_file_select on public.mission_file for select to authenticated
  using (public.is_project_overseer() or public.is_project_member(public.mission_project(mission_id)));
create policy mission_file_insert on public.mission_file for insert to authenticated
  with check (public.can_manage_mission(mission_id) and linked_by = auth.uid() and public.can_view_file(file_id));
create policy mission_file_update on public.mission_file for update to authenticated
  using (public.can_manage_mission(mission_id)) with check (public.can_manage_mission(mission_id));
create policy mission_file_delete on public.mission_file for delete to authenticated
  using (public.can_manage_mission(mission_id));

create policy allowlist_read on public.file_type_allowlist for select to authenticated using (true);

revoke all on all tables in schema public from anon;
