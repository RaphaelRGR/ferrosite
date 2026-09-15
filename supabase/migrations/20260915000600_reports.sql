-- REPORT-001 — indicadores com fórmula única (19): a mesma função alimenta o painel
-- e a exportação; snapshots imutáveis para relatórios históricos. Indicador sem
-- fonte definida devolve NULL ("sem dados"), nunca zero.

create table public.report_snapshot (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'indicators' check (kind in ('indicators')),
  period_start date not null,
  period_end date not null,
  formulas_version integer not null,
  data jsonb not null,
  generated_by uuid not null references public.profile (id),
  generated_at timestamptz not null default now(),
  constraint report_snapshot_period check (period_end >= period_start)
);
create index report_snapshot_generated_idx on public.report_snapshot (generated_at desc);

-- Versão das fórmulas: mudar uma fórmula exige incrementar aqui (snapshots antigos guardam a sua).
create or replace function public.indicator_formulas_version() returns integer language sql immutable as $$ select 1 $$;

-- Período em America/Sao_Paulo (19: declarar timezone). Fim é inclusivo (até 23:59:59 do dia).
create or replace function public.compute_indicators(p_start date, p_end date)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  t0 timestamptz := (p_start::text || ' 00:00:00')::timestamp at time zone 'America/Sao_Paulo';
  t1 timestamptz := ((p_end + 1)::text || ' 00:00:00')::timestamp at time zone 'America/Sao_Paulo';
  active_projects integer;
  missions_done integer;
  late_num integer;
  late_den integer;
  students integer;
  ch_received integer;
  ch_screened integer;
  ch_accepted integer;
  orgs integer;
begin
  if not public.has_global_role('admin', 'coordination') then
    raise exception 'indicadores são da coordenação/administração' using errcode = '42501';
  end if;
  if p_end < p_start then
    raise exception 'período inválido' using errcode = '23514';
  end if;

  -- projetos ativos no instante (19: count(project where state=active))
  select count(*) into active_projects from public.project where status = 'active';

  -- missões concluídas no período: transições para concluída (não o estado atual)
  select count(distinct mission_id) into missions_done
  from public.activity_event
  where kind = 'mission.status' and to_value = 'done' and occurred_at >= t0 and occurred_at < t1;

  -- taxa de atraso: (concluídas após o prazo no período + abertas vencidas) / missões com prazo
  select
    count(*) filter (where (m.status = 'done' and m.completed_at > m.due_at and m.completed_at >= t0 and m.completed_at < t1)
                        or (m.status not in ('done', 'cancelled') and m.due_at < now())),
    count(*) filter (where m.status <> 'cancelled')
  into late_num, late_den
  from public.mission m where m.due_at is not null;

  -- alunos envolvidos: perfis com papel global member e membership ativa criada até o fim do período
  select count(distinct pm.profile_id) into students
  from public.project_membership pm join public.profile p on p.id = pm.profile_id
  where p.global_role = 'member' and pm.status = 'active' and pm.created_at < t1
    and (pm.expires_at is null or pm.expires_at >= t0);

  -- desafios P&D: funil recebidos / triados (saíram de recebido) / aceitos no período
  select count(*) into ch_received from public.research_challenge where created_at >= t0 and created_at < t1;
  select count(distinct challenge_id) into ch_screened from public.crm_event
   where kind = 'challenge.status' and from_value = 'received' and occurred_at >= t0 and occurred_at < t1;
  select count(distinct challenge_id) into ch_accepted from public.crm_event
   where kind = 'challenge.status' and to_value = 'accepted' and occurred_at >= t0 and occurred_at < t1;

  -- organizações envolvidas: vínculo definido = desafio vinculado ou parceria confirmada no período
  select count(distinct o.id) into orgs
  from public.organization o
  where exists (select 1 from public.crm_event e where e.organization_id = o.id and e.kind = 'organization.stage' and e.to_value = 'confirmed' and e.occurred_at >= t0 and e.occurred_at < t1)
     or exists (select 1 from public.crm_event e where e.challenge_id is not null and e.kind = 'challenge.linked' and e.to_value = o.id::text and e.occurred_at >= t0 and e.occurred_at < t1);

  return jsonb_build_object(
    'period', jsonb_build_object('start', p_start, 'end', p_end, 'timezone', 'America/Sao_Paulo'),
    'formulas_version', public.indicator_formulas_version(),
    'indicators', jsonb_build_array(
      jsonb_build_object('id', 'active_projects', 'value', active_projects, 'source', 'project', 'formula', 'count(project where status = active) no instante da geração'),
      jsonb_build_object('id', 'missions_done', 'value', missions_done, 'source', 'activity_event', 'formula', 'transições mission.status → done no período'),
      jsonb_build_object('id', 'late_rate', 'value', case when late_den = 0 then null else round(late_num::numeric / late_den, 4) end, 'numerator', late_num, 'denominator', late_den, 'source', 'mission', 'formula', '(concluídas após o prazo no período + abertas vencidas) / missões com prazo (exclui canceladas)'),
      jsonb_build_object('id', 'organizations_involved', 'value', orgs, 'source', 'crm_event', 'formula', 'organizações distintas com parceria confirmada ou desafio vinculado no período'),
      jsonb_build_object('id', 'students_involved', 'value', students, 'source', 'project_membership', 'formula', 'perfis com papel member e membership ativa vigente no período (deduplicado por pessoa)'),
      jsonb_build_object('id', 'visits_done', 'value', null, 'source', null, 'formula', 'experiências tipo visita realizadas — entidade experience ainda não existe'),
      jsonb_build_object('id', 'hours_logged', 'value', null, 'source', null, 'formula', 'soma de time_entry aprovado — entidade time_entry ainda não existe'),
      jsonb_build_object('id', 'challenges_funnel', 'value', jsonb_build_object('received', ch_received, 'screened', ch_screened, 'accepted', ch_accepted), 'source', 'research_challenge, crm_event', 'formula', 'recebidos (created_at) / saíram de recebido / chegaram a aceito, no período'),
      jsonb_build_object('id', 'funding', 'value', null, 'source', null, 'formula', 'soma por estado/fonte/moeda — entidade funding ainda não existe (acesso restrito)')
    )
  );
end $$;

-- Snapshot imutável (relatório histórico não muda quando os dados operacionais mudam).
create or replace function public.snapshot_indicators(p_start date, p_end date)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  payload jsonb;
  sid uuid;
begin
  payload := public.compute_indicators(p_start, p_end);
  insert into public.report_snapshot (period_start, period_end, formulas_version, data, generated_by)
  values (p_start, p_end, public.indicator_formulas_version(), payload, auth.uid())
  returning id into sid;
  perform public.log_audit('report.snapshot', 'report_snapshot', sid::text, 'ok', jsonb_build_object('start', p_start, 'end', p_end));
  return sid;
end $$;

revoke all on function public.compute_indicators(date, date) from public, anon;
revoke all on function public.snapshot_indicators(date, date) from public, anon;
grant execute on function public.compute_indicators(date, date) to authenticated;
grant execute on function public.snapshot_indicators(date, date) to authenticated;

alter table public.report_snapshot enable row level security;
create policy report_snapshot_select on public.report_snapshot for select to authenticated using (public.is_project_overseer());
-- Sem insert/update/delete direto: só via snapshot_indicators (append-only).
create trigger report_snapshot_immutable before update or delete on public.report_snapshot for each row execute function public.forbid_delete();

-- revoke genérico inclui views: reafirma a única leitura pública (projeção, PUB-001)
revoke all on all tables in schema public from anon;
grant select on public.public_publication to anon, authenticated;
