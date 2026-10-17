-- ACC-001 (2026-10-17): excluir contas do Portal.
-- Decisão do usuário: excluir apaga sempre o login e o e-mail. Conta sem histórico sai por completo;
-- conta com histórico (autoria, aprovações, auditoria) vira "Conta excluída" e os registros antigos
-- continuam íntegros. A auditoria segue só-acréscimo.
-- O login (auth.users) é apagado pelo servidor com a service role, depois desta função.

alter table public.profile add column deleted_at timestamptz;

-- O perfil precisa poder sobreviver ao login apagado (tombstone do histórico).
do $$
declare c text;
begin
  select conname into c from pg_constraint
  where conrelid = 'public.profile'::regclass and contype = 'f' and confrelid = 'auth.users'::regclass;
  if c is not null then
    execute format('alter table public.profile drop constraint %I', c);
  end if;
end $$;

-- Guard: igual ao anterior, mais (1) deleted_at só muda pela exclusão e (2) a exceção da exclusão,
-- que vale só com o flag da transação, admin chamando, outra conta e exatamente a forma da anonimização.
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  admins_left integer;
begin
  -- Sem usuário (migrations, service role, SQL editor): provisionamento inicial passa sem guard.
  if auth.uid() is null then
    return new;
  end if;
  if current_setting('ferrosite.profile_erasure', true) = 'on'
     and public.has_global_role('admin')
     and new.id <> auth.uid()
     and old.deleted_at is null and new.deleted_at is not null
     and old.status = 'disabled' and new.status = 'disabled'
     and new.global_role = 'viewer' then
    return new;
  end if;
  if old.deleted_at is not null then
    raise exception 'conta excluída não pode ser alterada' using errcode = '42501';
  end if;
  if new.deleted_at is distinct from old.deleted_at then
    raise exception 'a exclusão de conta só acontece pela função erase_profile' using errcode = '42501';
  end if;
  if (new.global_role is distinct from old.global_role or new.status is distinct from old.status) then
    if not public.has_global_role('admin') then
      raise exception 'apenas administradores alteram papel ou status' using errcode = '42501';
    end if;
    if (old.global_role = 'admin' and old.status = 'active')
       and (new.global_role <> 'admin' or new.status <> 'active') then
      select count(*) into admins_left from public.profile
      where global_role = 'admin' and status = 'active' and id <> old.id;
      if admins_left = 0 then
        raise exception 'o último administrador ativo não pode ser removido' using errcode = '42501';
      end if;
    end if;
    perform public.log_audit('profile.privileges_changed', 'profile', old.id::text, 'ok',
      jsonb_build_object('role', jsonb_build_array(old.global_role, new.global_role),
                         'status', jsonb_build_array(old.status, new.status)));
  end if;
  -- e-mail espelha auth.users; não é editável aqui
  new.email := old.email;
  return new;
end $$;

-- Exclui uma conta desativada: remove o perfil se nada o referencia; senão anonimiza.
-- Devolve 'removed', 'anonymized' ou 'missing' (perfil já não existe: falta só apagar o login).
create or replace function public.erase_profile(p_target uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare
  t public.profile;
  mode text;
begin
  if not public.has_global_role('admin') then
    raise exception 'apenas administradores excluem contas' using errcode = '42501';
  end if;
  if p_target = auth.uid() then
    raise exception 'você não pode excluir a própria conta' using errcode = '42501';
  end if;
  select * into t from public.profile where id = p_target for update;
  if not found then
    return 'missing';
  end if;
  if t.deleted_at is not null then
    return 'anonymized';
  end if;
  if t.status <> 'disabled' then
    raise exception 'desative a conta antes de excluir' using errcode = '42501';
  end if;

  -- avisos ainda não enviados para a conta não saem mais
  delete from public.mail_outbox where recipient_profile_id = p_target and status = 'queued';

  begin
    delete from public.profile where id = p_target;
    mode := 'removed';
  exception when foreign_key_violation then
    mode := 'anonymized';
  end;

  if mode = 'anonymized' then
    delete from public.project_membership where profile_id = p_target;
    delete from public.mission_assignee where profile_id = p_target;
    delete from public.user_preference where profile_id = p_target;
    perform set_config('ferrosite.profile_erasure', 'on', true);
    update public.profile
       set email = '', full_name = 'Conta excluída', global_role = 'viewer', deleted_at = now()
     where id = p_target;
    perform set_config('ferrosite.profile_erasure', 'off', true);
  end if;

  perform public.log_audit('profile.erased', 'profile', p_target::text, 'ok', jsonb_build_object('mode', mode));
  return mode;
end $$;

revoke all on function public.erase_profile(uuid) from public;
grant execute on function public.erase_profile(uuid) to authenticated;
