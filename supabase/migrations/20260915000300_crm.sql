-- CRM-001 — organizações, contatos, interações, pipeline de parceria e desafios de P&D (13, 14, 21).
-- Tudo é interno/restrito: nenhuma tabela aqui é lida pelo site público. O formulário
-- "Tenho um desafio" entra por função security definer executável só pelo service role
-- (a Server Action do site), com limite de envios, consentimento e auditoria.

create type public.organization_kind as enum ('company', 'public_body', 'academic', 'association', 'other');
create type public.partnership_stage as enum ('mapped', 'contacted', 'meeting', 'proposal', 'negotiation', 'confirmed', 'lost', 'paused');
create type public.relationship_activity_kind as enum ('note', 'call', 'email', 'meeting', 'visit', 'proposal');
create type public.challenge_status as enum ('received', 'screening', 'forwarded', 'proposal', 'accepted', 'declined', 'closed');

-- ─── Organização ≠ contato (13) ────────────────────────────────────────────
create table public.organization (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 200),
  kind public.organization_kind not null default 'company',
  sector text not null default '',
  city text not null default '',
  state text not null default '',
  country text not null default 'BR',
  website text not null default '' check (website = '' or website ~ '^https?://'),
  -- "parceiro público" depende de aprovação e autorização de marca (13): só overseer marca.
  public_partner boolean not null default false,
  brand_authorized_at timestamptz,
  stage public.partnership_stage not null default 'mapped',
  stage_reason text not null default '',
  owner_id uuid references public.profile (id),
  notes text not null default '',
  created_by uuid not null references public.profile (id),
  updated_by uuid not null references public.profile (id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  constraint organization_public_requires_brand check (not public_partner or brand_authorized_at is not null)
);
create index organization_stage_idx on public.organization (stage) where archived_at is null;

create table public.contact (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete cascade,
  full_name text not null check (length(full_name) between 2 and 160),
  role_title text not null default '',
  email text not null default '',
  phone text not null default '',
  consent_note text not null default '',
  created_by uuid not null references public.profile (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1
);
create index contact_org_idx on public.contact (organization_id);

create table public.relationship_activity (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete cascade,
  contact_id uuid references public.contact (id) on delete set null,
  kind public.relationship_activity_kind not null default 'note',
  occurred_at timestamptz not null default now(),
  summary text not null check (length(summary) between 1 and 4000),
  next_action text not null default '',
  next_action_at timestamptz,
  created_by uuid not null references public.profile (id),
  created_at timestamptz not null default now()
);
create index relationship_activity_org_idx on public.relationship_activity (organization_id, occurred_at desc);

-- ─── Desafio de P&D (13 "jornada de desafio", 14 "triagem") ────────────────
create table public.research_challenge (
  id uuid primary key default gen_random_uuid(),
  protocol text not null unique,
  organization_name text not null check (length(organization_name) between 2 and 200),
  organization_id uuid references public.organization (id),
  contact_name text not null check (length(contact_name) between 2 and 160),
  contact_email text not null check (contact_email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  contact_phone text not null default '',
  title text not null check (length(title) between 5 and 200),
  description text not null check (length(description) between 20 and 6000),
  capability_ids text[] not null default '{}',
  confidentiality_requested boolean not null default false,
  consent_at timestamptz not null,
  locale text not null default 'pt' check (locale in ('pt', 'en')),
  status public.challenge_status not null default 'received',
  assigned_to uuid references public.profile (id),
  triage_notes text not null default '',
  submitter_hash text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profile (id),
  version integer not null default 1
);
create index research_challenge_status_idx on public.research_challenge (status, created_at desc);

-- Histórico do CRM (ator/origem/destino/data) — negócio, não auditoria de segurança.
create table public.crm_event (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organization (id) on delete cascade,
  challenge_id uuid references public.research_challenge (id) on delete cascade,
  actor_id uuid references public.profile (id),
  kind text not null,
  from_value text,
  to_value text,
  occurred_at timestamptz not null default now(),
  payload jsonb,
  constraint crm_event_target check (organization_id is not null or challenge_id is not null)
);
create index crm_event_org_idx on public.crm_event (organization_id, occurred_at desc);
create index crm_event_challenge_idx on public.crm_event (challenge_id, occurred_at desc);

-- Limite de envios do formulário público (por hash de origem e por e-mail).
create table public.public_submission_rate (
  bucket text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 0
);

-- ─── Triggers: updated_at/version, transições registradas ──────────────────
create trigger organization_touch before update on public.organization for each row execute function public.touch_updated_at();
create trigger contact_touch before update on public.contact for each row execute function public.touch_updated_at();
create trigger challenge_touch before update on public.research_challenge for each row execute function public.touch_updated_at();

create or replace function public.log_crm(
  p_org uuid, p_challenge uuid, p_kind text, p_from text default null, p_to text default null, p_payload jsonb default null
) returns void
language sql security definer set search_path = public
as $$
  insert into public.crm_event (organization_id, challenge_id, actor_id, kind, from_value, to_value, payload)
  values (p_org, p_challenge, auth.uid(), p_kind, p_from, p_to, p_payload)
$$;
revoke all on function public.log_crm(uuid, uuid, text, text, text, jsonb) from public, anon, authenticated;

-- Pipeline de parceria (13): Mapeado → Contato → Reunião → Proposta → Negociação → Confirmado;
-- Perdido/Pausado com motivo. Toda transição registra ator/data.
create or replace function public.guard_organization_stage()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  o text := old.stage::text;
  n text := new.stage::text;
begin
  if o <> n then
    if n in ('lost', 'paused') and length(trim(new.stage_reason)) = 0 then
      raise exception 'informe o motivo para marcar como perdido/pausado' using errcode = '23514';
    end if;
    perform public.log_crm(new.id, null, 'organization.stage', o, n, jsonb_build_object('reason', new.stage_reason));
  end if;
  if new.public_partner and not old.public_partner then
    if auth.uid() is not null and not public.has_global_role('admin', 'coordination') then
      raise exception 'apenas coordenação/administração publica parceiros' using errcode = '42501';
    end if;
    perform public.log_audit('organization.public_partner', 'organization', new.id::text, 'ok', jsonb_build_object('brand_authorized_at', new.brand_authorized_at));
  end if;
  return new;
end $$;
create trigger organization_stage before update on public.organization
  for each row execute function public.guard_organization_stage();

-- Desafio: recebido → triagem → encaminhado → proposta → aceito/recusado → encerrado.
create or replace function public.guard_challenge_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  o text := old.status::text;
  n text := new.status::text;
  allowed boolean;
begin
  if o = n then
    if new.assigned_to is distinct from old.assigned_to then
      perform public.log_crm(null, new.id, 'challenge.assigned', old.assigned_to::text, new.assigned_to::text, null);
    end if;
    if new.organization_id is distinct from old.organization_id then
      perform public.log_crm(null, new.id, 'challenge.linked', old.organization_id::text, new.organization_id::text, null);
    end if;
    return new;
  end if;
  allowed := case o
    when 'received'  then n in ('screening', 'declined')
    when 'screening' then n in ('forwarded', 'declined', 'closed')
    when 'forwarded' then n in ('proposal', 'declined', 'closed')
    when 'proposal'  then n in ('accepted', 'declined', 'closed')
    when 'accepted'  then n in ('closed')
    when 'declined'  then n in ('closed')
    else false
  end;
  if not allowed then
    raise exception 'transição de desafio inválida: % → %', o, n using errcode = '23514';
  end if;
  perform public.log_crm(null, new.id, 'challenge.status', o, n, null);
  return new;
end $$;
create trigger challenge_status before update on public.research_challenge
  for each row execute function public.guard_challenge_status();

create trigger organization_no_delete before delete on public.organization for each row execute function public.forbid_delete();
create trigger challenge_no_delete before delete on public.research_challenge for each row execute function public.forbid_delete();

-- ─── Envio público (service role only) ─────────────────────────────────────
-- Protocolo legível: DES-AAAA-NNNNNN (sequência por ano).
create sequence public.challenge_protocol_seq;

create or replace function public.submit_research_challenge(
  p_organization_name text, p_contact_name text, p_contact_email text, p_contact_phone text,
  p_title text, p_description text, p_capability_ids text[], p_confidentiality boolean,
  p_locale text, p_submitter_hash text
) returns text
language plpgsql security definer set search_path = public
as $$
declare
  email_key text := 'email:' || lower(trim(p_contact_email));
  ip_key text := 'ip:' || coalesce(p_submitter_hash, '');
  proto text;
  new_id uuid;
begin
  -- Limites: 5 por hora por origem, 3 por dia por e-mail (21: rate limit e anti-spam).
  if not public.consume_submission_budget(ip_key, interval '1 hour', 5) then
    raise exception 'limite de envios atingido; tente mais tarde' using errcode = 'P0001';
  end if;
  if not public.consume_submission_budget(email_key, interval '1 day', 3) then
    raise exception 'limite de envios atingido para este e-mail' using errcode = 'P0001';
  end if;
  proto := 'DES-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.challenge_protocol_seq')::text, 6, '0');
  insert into public.research_challenge (
    protocol, organization_name, contact_name, contact_email, contact_phone, title, description,
    capability_ids, confidentiality_requested, consent_at, locale, submitter_hash
  ) values (
    proto, trim(p_organization_name), trim(p_contact_name), lower(trim(p_contact_email)), coalesce(trim(p_contact_phone), ''),
    trim(p_title), trim(p_description), coalesce(p_capability_ids, '{}'), coalesce(p_confidentiality, false), now(),
    case when p_locale = 'en' then 'en' else 'pt' end, coalesce(p_submitter_hash, '')
  ) returning id into new_id;
  -- Auditoria sem ecoar detalhes sensíveis (13): só protocolo e origem.
  insert into public.audit_event (actor_id, action, target_type, target_id, result, origin, diff)
  values (null, 'challenge.submitted', 'research_challenge', new_id::text, 'ok', 'public-form', jsonb_build_object('protocol', proto));
  insert into public.crm_event (challenge_id, kind, to_value) values (new_id, 'challenge.received', 'received');
  return proto;
end $$;

create or replace function public.consume_submission_budget(p_bucket text, p_window interval, p_limit integer)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  r public.public_submission_rate%rowtype;
begin
  insert into public.public_submission_rate (bucket) values (p_bucket)
  on conflict (bucket) do nothing;
  select * into r from public.public_submission_rate where bucket = p_bucket for update;
  if r.window_start + p_window < now() then
    update public.public_submission_rate set window_start = now(), count = 1 where bucket = p_bucket;
    return true;
  end if;
  if r.count >= p_limit then
    return false;
  end if;
  update public.public_submission_rate set count = count + 1 where bucket = p_bucket;
  return true;
end $$;

revoke all on function public.submit_research_challenge(text, text, text, text, text, text, text[], boolean, text, text) from public, anon, authenticated;
revoke all on function public.consume_submission_budget(text, interval, integer) from public, anon, authenticated;
grant execute on function public.submit_research_challenge(text, text, text, text, text, text, text[], boolean, text, text) to service_role;

-- ─── RLS: CRM é de coordenação/administração; orientador vê desafios atribuídos a ele ──
alter table public.organization enable row level security;
alter table public.contact enable row level security;
alter table public.relationship_activity enable row level security;
alter table public.research_challenge enable row level security;
alter table public.crm_event enable row level security;
alter table public.public_submission_rate enable row level security;

create policy organization_overseer on public.organization for all to authenticated
  using (public.is_project_overseer()) with check (public.is_project_overseer() and updated_by = auth.uid());
create policy contact_overseer on public.contact for all to authenticated
  using (public.is_project_overseer()) with check (public.is_project_overseer());
create policy activity_overseer on public.relationship_activity for all to authenticated
  using (public.is_project_overseer()) with check (public.is_project_overseer() and created_by = auth.uid());
create policy challenge_select on public.research_challenge for select to authenticated
  using (public.is_project_overseer() or assigned_to = auth.uid());
create policy challenge_update on public.research_challenge for update to authenticated
  using (public.is_project_overseer() or assigned_to = auth.uid())
  with check ((public.is_project_overseer() or assigned_to = auth.uid()) and updated_by = auth.uid());
create policy crm_event_select on public.crm_event for select to authenticated
  using (public.is_project_overseer());
-- public_submission_rate: sem policies (só service role via função).

revoke all on all tables in schema public from anon;
