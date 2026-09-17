-- MAIL-001 — E-mail transacional: caixa de saída no banco (fonte única do que
-- deve ser enviado), enfileirada por triggers nos eventos de negócio; o envio
-- em si acontece no servidor da aplicação (service role) via provedor externo.
-- Sem provedor configurado, nada se perde: as linhas ficam em `queued`.
-- Guarda só o mínimo para o texto do e-mail (protocolo, título, caminho);
-- nunca a descrição do desafio nem dados além do destinatário (13/21).

create type public.mail_status as enum ('queued', 'sent', 'failed');

create table public.mail_outbox (
  id uuid primary key default gen_random_uuid(),
  template text not null check (template in (
    'challenge_received', 'content_review_requested', 'content_decided', 'content_published', 'membership_granted'
  )),
  locale text not null default 'pt' check (locale in ('pt', 'en')),
  recipient_email text not null check (recipient_email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  recipient_profile_id uuid references public.profile (id) on delete set null,
  target_type text not null default '',
  target_id text not null default '',
  payload jsonb not null default '{}'::jsonb,
  status public.mail_status not null default 'queued',
  attempts integer not null default 0,
  last_error text not null default '',
  provider_message_id text not null default '',
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  sent_at timestamptz
);
create index mail_outbox_status_idx on public.mail_outbox (status, created_at);

alter table public.mail_outbox enable row level security;
-- Administração acompanha a fila (sem editar): o envio é do service role.
create policy mail_outbox_admin_select on public.mail_outbox for select to authenticated
  using (public.has_global_role('admin'));
revoke all on public.mail_outbox from anon;

-- Enfileira sem depender da sessão (chamada por triggers, security definer).
create or replace function public.enqueue_mail(
  p_template text, p_locale text, p_email text, p_profile uuid, p_target_type text, p_target_id text, p_payload jsonb
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_email is null or p_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    return;
  end if;
  insert into public.mail_outbox (template, locale, recipient_email, recipient_profile_id, target_type, target_id, payload)
  values (p_template, case when p_locale = 'en' then 'en' else 'pt' end, lower(trim(p_email)), p_profile, coalesce(p_target_type, ''), coalesce(p_target_id, ''), coalesce(p_payload, '{}'::jsonb));
end $$;
revoke all on function public.enqueue_mail(text, text, text, uuid, text, text, jsonb) from public, anon, authenticated;

-- Destinatário interno: só perfis ativos, no idioma da preferência (PT por padrão).
create or replace function public.enqueue_mail_to_profile(
  p_template text, p_profile uuid, p_target_type text, p_target_id text, p_payload jsonb
) returns void
language plpgsql security definer set search_path = public as $$
declare
  rec record;
begin
  select p.email, p.status, coalesce(u.locale, 'pt') as locale
    into rec
    from public.profile p
    left join public.user_preference u on u.profile_id = p.id
   where p.id = p_profile;
  if rec is null or rec.status <> 'active' then
    return;
  end if;
  perform public.enqueue_mail(p_template, rec.locale, rec.email, p_profile, p_target_type, p_target_id, p_payload);
end $$;
revoke all on function public.enqueue_mail_to_profile(text, uuid, text, text, jsonb) from public, anon, authenticated;

-- ─── Eventos que geram e-mail ──────────────────────────────────────────────

-- Desafio recebido pelo site: confirmação com protocolo à empresa (13 "jornada de desafio").
create or replace function public.mail_on_challenge()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.enqueue_mail('challenge_received', new.locale, new.contact_email, null, 'research_challenge', new.id::text,
    jsonb_build_object('protocol', new.protocol, 'title', new.title, 'contactName', new.contact_name));
  return new;
end $$;
create trigger challenge_mail after insert on public.research_challenge
  for each row execute function public.mail_on_challenge();

-- Conteúdo: pedido de revisão avisa aprovadores (exceto o autor); decisão e publicação avisam o autor (18).
create or replace function public.mail_on_content_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  n text := new.status::text;
  approver record;
  base jsonb := jsonb_build_object('title', new.title, 'type', new.type::text, 'slug', new.slug, 'contentLocale', new.locale);
begin
  if old.status = new.status then
    return new;
  end if;
  if n = 'review' then
    for approver in
      select id from public.profile
       where status = 'active' and global_role in ('admin', 'coordination') and id <> new.author_id
    loop
      perform public.enqueue_mail_to_profile('content_review_requested', approver.id, 'content_item', new.id::text, base);
    end loop;
  elsif n in ('approved', 'changes_requested') then
    perform public.enqueue_mail_to_profile('content_decided', new.author_id, 'content_item', new.id::text, base || jsonb_build_object('decision', n));
  elsif n = 'published' then
    perform public.enqueue_mail_to_profile('content_published', new.author_id, 'content_item', new.id::text, base);
  end if;
  return new;
end $$;
create trigger content_mail after update of status on public.content_item
  for each row execute function public.mail_on_content_status();

-- Equipe: quem passa a integrar um projeto é avisado (11: grants explícitos, com prazo quando externo).
create or replace function public.mail_on_membership()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  proj record;
begin
  if new.status <> 'active' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = 'active' and old.role = new.role and old.expires_at is not distinct from new.expires_at then
    return new;
  end if;
  select name, slug into proj from public.project where id = new.project_id;
  perform public.enqueue_mail_to_profile('membership_granted', new.profile_id, 'project', new.project_id::text,
    jsonb_build_object('projectTitle', proj.name, 'projectSlug', proj.slug, 'role', new.role::text, 'expiresAt', new.expires_at));
  return new;
end $$;
create trigger membership_mail after insert or update on public.project_membership
  for each row execute function public.mail_on_membership();

-- ─── Entrega (service role) ────────────────────────────────────────────────
-- Reserva um lote para envio (SKIP LOCKED: entrega pós-resposta e cron não
-- disputam a mesma linha); tentativas limitadas para não martelar o provedor.
create or replace function public.claim_mail_outbox(p_limit integer default 20)
returns setof public.mail_outbox
language plpgsql security definer set search_path = public as $$
begin
  return query
    update public.mail_outbox m
       set claimed_at = now(), attempts = m.attempts + 1
     where m.id in (
       select id from public.mail_outbox
        where status = 'queued' and attempts < 5
          and (claimed_at is null or claimed_at < now() - interval '10 minutes')
        order by created_at
        limit greatest(1, least(coalesce(p_limit, 20), 100))
        for update skip locked
     )
    returning m.*;
end $$;

-- p_retry=false: erro definitivo do provedor (remetente/destinatário inválido) — não insiste.
create or replace function public.settle_mail_outbox(p_id uuid, p_ok boolean, p_detail text default '', p_retry boolean default true)
returns void
language sql security definer set search_path = public as $$
  update public.mail_outbox
     set status = case when p_ok then 'sent'::public.mail_status
                       when not p_retry or attempts >= 5 then 'failed'::public.mail_status
                       else 'queued'::public.mail_status end,
         sent_at = case when p_ok then now() else sent_at end,
         provider_message_id = case when p_ok then coalesce(p_detail, '') else provider_message_id end,
         last_error = case when p_ok then '' else left(coalesce(p_detail, ''), 500) end,
         claimed_at = null
   where id = p_id
$$;

revoke all on function public.claim_mail_outbox(integer) from public, anon, authenticated;
revoke all on function public.settle_mail_outbox(uuid, boolean, text, boolean) from public, anon, authenticated;
grant execute on function public.claim_mail_outbox(integer) to service_role;
grant execute on function public.settle_mail_outbox(uuid, boolean, text, boolean) to service_role;

-- Resumo para a administração (Configurações → E-mails), sem expor destinatários.
create or replace function public.mail_outbox_summary()
returns table (status public.mail_status, total bigint, last_at timestamptz)
language sql security definer set search_path = public as $$
  select m.status, count(*), max(coalesce(m.sent_at, m.created_at))
    from public.mail_outbox m
   where public.has_global_role('admin') and m.created_at > now() - interval '30 days'
   group by m.status
$$;
revoke all on function public.mail_outbox_summary() from public, anon;
grant execute on function public.mail_outbox_summary() to authenticated;

-- revoke genérico repetido por segurança da projeção pública (PUB-001)
revoke all on all tables in schema public from anon;
grant select on public.public_publication to anon, authenticated;
