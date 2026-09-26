-- ACT-002: Entrada/triagem, Lembrar depois e decisão com opções.
-- As colunas nasceram em 20260927000100; aqui só o que faltava para usá-las:
-- histórico de "lembrar depois" e limites das opções de decisão.

-- Opções de decisão: até 8, cada uma curta e preenchida.
create or replace function public.valid_decision_options(p text[])
returns boolean language sql immutable as $$
  select coalesce(array_length(p, 1), 0) <= 8
    and not exists (select 1 from unnest(p) o where length(trim(o)) = 0 or length(o) > 200)
$$;
alter table public.work_item add constraint work_item_decision_options_valid check (public.valid_decision_options(decision_options));

-- "Lembrar depois" vai para o histórico (adiar e trazer de volta).
create or replace function public.log_work_item_snooze()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.snoozed_until is not null then
    perform public.log_work_item(new.id, 'snoozed', old.snoozed_until::text, new.snoozed_until::text, '');
  else
    perform public.log_work_item(new.id, 'unsnoozed', old.snoozed_until::text, null, '');
  end if;
  return new;
end $$;
create trigger work_item_snooze_log after update of snoozed_until on public.work_item
  for each row when (new.snoozed_until is distinct from old.snoozed_until)
  execute function public.log_work_item_snooze();
