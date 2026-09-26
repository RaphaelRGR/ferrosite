-- ACT-002 (correção): arquivar um item da Entrada (sem responsável) e reabri-lo.
-- A regra "responsável obrigatório fora da Entrada" impedia cancelar item sem
-- dono; e um cancelado sem dono só pode voltar para a Entrada.

alter table public.work_item drop constraint work_item_owner_required;
alter table public.work_item add constraint work_item_owner_required check (status in ('inbox', 'cancelled') or owner_id is not null);

-- Mesma guarda de 20260927000100, com cancelada → entrada permitida.
create or replace function public.guard_work_item_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  o text := old.status::text;
  n text := new.status::text;
  overseer boolean := auth.uid() is null or public.is_project_overseer();
  allowed boolean;
  note text := coalesce(new.status_note, '');
begin
  new.status_note := '';

  -- Quem não é admin/coordenação só mexe no andamento do próprio item.
  if not overseer and (
    new.owner_id is distinct from old.owner_id or new.approver_id is distinct from old.approver_id
    or new.due_at is distinct from old.due_at or new.kind <> old.kind or new.title <> old.title
    or new.description <> old.description or new.priority <> old.priority
    or new.project_id is distinct from old.project_id or new.mission_id is distinct from old.mission_id
    or new.organization_id is distinct from old.organization_id or new.decision_options <> old.decision_options
  ) then
    raise exception 'apenas administração e coordenação alteram responsável, prazo e dados da ação' using errcode = '42501';
  end if;

  if o <> n then
    allowed := case o
      when 'inbox'             then n in ('planned', 'in_progress', 'cancelled')
      when 'planned'           then n in ('in_progress', 'waiting', 'blocked', 'awaiting_approval', 'done', 'cancelled')
      when 'in_progress'       then n in ('planned', 'waiting', 'blocked', 'awaiting_approval', 'done', 'cancelled')
      when 'waiting'           then n in ('in_progress', 'planned', 'blocked', 'awaiting_approval', 'done', 'cancelled')
      when 'blocked'           then n in ('in_progress', 'planned', 'waiting', 'cancelled')
      when 'awaiting_approval' then n in ('done', 'in_progress', 'cancelled')
      when 'done'              then n in ('in_progress')
      when 'cancelled'         then n in ('planned', 'inbox')
      else false
    end;
    if not allowed then
      raise exception 'transição de ação inválida: % → %', o, n using errcode = '23514';
    end if;

    if n = 'awaiting_approval' then
      if new.approver_id is null then
        raise exception 'escolha quem aprova antes de pedir aprovação' using errcode = '23514';
      end if;
      if new.approver_id = new.owner_id then
        raise exception 'quem responde pela ação não aprova a própria entrega' using errcode = '23514';
      end if;
    end if;

    if o = 'awaiting_approval' and n in ('done', 'in_progress') then
      if auth.uid() is not null and auth.uid() is distinct from old.approver_id then
        raise exception 'só quem foi indicado para aprovar pode aprovar ou pedir alterações' using errcode = '42501';
      end if;
      if n = 'in_progress' and length(trim(note)) = 0 then
        raise exception 'diga o que precisa ser ajustado' using errcode = '23514';
      end if;
    end if;

    if n = 'done' and o <> 'awaiting_approval' and new.approver_id is not null and new.kind <> 'decision' then
      raise exception 'ação com aprovador é concluída pela aprovação' using errcode = '23514';
    end if;

    if (o in ('done', 'cancelled')) and not overseer then
      raise exception 'reabrir é reservado à administração e à coordenação' using errcode = '42501';
    end if;

    -- espera: "desde" automático; ao sair, limpa quem era aguardado
    if n = 'waiting' then
      new.waiting_since := now();
    elsif o = 'waiting' then
      new.waiting_on := null;
      new.waiting_note := '';
      new.waiting_since := null;
    end if;

    new.completed_at := case when n = 'done' then now() else null end;

    if o = 'awaiting_approval' and n = 'done' then
      new.approved_by := auth.uid();
      new.approved_at := now();
      perform public.log_work_item(new.id, 'approved', null, null, note);
      perform public.log_audit('work_item.approved', 'work_item', new.id::text, 'ok', null);
    elsif o = 'awaiting_approval' and n = 'in_progress' then
      perform public.log_work_item(new.id, 'changes_requested', null, null, note);
      perform public.log_audit('work_item.changes_requested', 'work_item', new.id::text, 'ok', null);
    elsif n = 'awaiting_approval' then
      perform public.log_work_item(new.id, 'approval_requested', null, new.approver_id::text, note);
    else
      perform public.log_work_item(new.id, 'status', o, n, note);
    end if;
  elsif new.status = 'waiting' and (new.waiting_on is distinct from old.waiting_on or new.waiting_note <> old.waiting_note) then
    new.waiting_since := coalesce(old.waiting_since, now());
  end if;

  if n = 'waiting' and (o <> 'waiting' or new.waiting_on is distinct from old.waiting_on or new.waiting_note <> old.waiting_note) then
    perform public.log_work_item(new.id, 'waiting', null, new.waiting_on::text, new.waiting_note);
  end if;

  -- decisão registrada: quem decidiu e quando (dono ou admin/coordenação)
  if new.decision_outcome <> old.decision_outcome and new.decision_outcome <> '' then
    if new.kind <> 'decision' then
      raise exception 'só itens do tipo decisão registram decisão' using errcode = '23514';
    end if;
    if not overseer and auth.uid() is distinct from old.owner_id then
      raise exception 'só quem responde pela decisão pode registrá-la' using errcode = '42501';
    end if;
    new.decided_by := auth.uid();
    new.decided_at := now();
    perform public.log_work_item(new.id, 'decided', null, null, new.decision_outcome);
  end if;

  if new.owner_id is distinct from old.owner_id then
    perform public.log_work_item(new.id, 'owner', old.owner_id::text, new.owner_id::text, '');
  end if;
  if new.due_at is distinct from old.due_at then
    perform public.log_work_item(new.id, 'due', old.due_at::text, new.due_at::text, '');
  end if;
  if new.approver_id is distinct from old.approver_id and o = n then
    perform public.log_work_item(new.id, 'approver', old.approver_id::text, new.approver_id::text, '');
  end if;
  if new.priority <> old.priority then
    perform public.log_work_item(new.id, 'priority', old.priority::text, new.priority::text, '');
  end if;
  return new;
end $$;
