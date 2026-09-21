-- DRIVE-002 — Conexão institucional com o Google Drive via OAuth (17/21).
-- Uma única linha: a conta Google que a coordenação autorizou e a pasta raiz.
-- Tokens ficam cifrados pela aplicação e a tabela NÃO tem policy para
-- `authenticated`: só o service role (servidor) lê/escreve. Admin/coordenação
-- enxergam o estado por função que nunca devolve token. A identidade do
-- Portal continua sendo o Supabase Auth — isto é só permissão para o Drive.

create type public.drive_connection_status as enum ('connected', 'revoked', 'disconnected');

create table public.drive_integration (
  singleton boolean primary key default true check (singleton),
  status public.drive_connection_status not null default 'disconnected',
  provider_account_email text not null default '',
  provider_account_name text not null default '',
  scope text not null default '',
  -- cifrados (AES-256-GCM) pela aplicação; nunca em claro
  access_token_enc text not null default '',
  refresh_token_enc text not null default '',
  access_token_expires_at timestamptz,
  root_folder_id text not null default '',
  root_folder_name text not null default '',
  connected_by uuid references public.profile (id),
  connected_at timestamptz,
  last_checked_at timestamptz,
  -- só contagens/estado, sem nomes de arquivos
  last_check_result jsonb not null default '{}'::jsonb,
  last_error text not null default '',
  updated_at timestamptz not null default now()
);
insert into public.drive_integration (singleton) values (true);

create trigger drive_integration_touch before update on public.drive_integration for each row execute function public.touch_updated_at();

alter table public.drive_integration enable row level security;
revoke all on public.drive_integration from anon, authenticated;

-- Estado visível à administração/coordenação: nada de token.
create or replace function public.drive_integration_status()
returns table (
  status public.drive_connection_status, provider_account_email text, provider_account_name text, scope text,
  root_folder_id text, root_folder_name text, connected_by uuid, connected_at timestamptz,
  last_checked_at timestamptz, last_check_result jsonb, last_error text, has_refresh_token boolean
)
language sql stable security definer set search_path = public as $$
  select d.status, d.provider_account_email, d.provider_account_name, d.scope,
         d.root_folder_id, d.root_folder_name, d.connected_by, d.connected_at,
         d.last_checked_at, d.last_check_result, d.last_error, d.refresh_token_enc <> ''
    from public.drive_integration d
   where public.has_global_role('admin', 'coordination')
$$;
revoke all on function public.drive_integration_status() from public, anon;
grant execute on function public.drive_integration_status() to authenticated;

revoke all on all tables in schema public from anon;
grant select on public.public_publication to anon, authenticated;
