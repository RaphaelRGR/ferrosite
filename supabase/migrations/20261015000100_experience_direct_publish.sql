-- EXP-001: experiências publicadas direto pela administração/coordenação (decisão do usuário, 2026-10-15).
-- Notícias e demais conteúdos continuam no fluxo com aprovação por outra pessoa (18). A única exceção à
-- regra "autor não aprova" vale dentro de publish_experience(), sinalizada por uma GUC local da transação.

create or replace function public.guard_content_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  o text := old.status::text;
  n text := new.status::text;
  allowed boolean;
  content_changed boolean;
  direct boolean := coalesce(current_setting('ferrosite.direct_publish', true), '') = 'on' and new.type = 'experience';
begin
  content_changed := new.title is distinct from old.title or new.summary is distinct from old.summary or new.body_md is distinct from old.body_md
    or new.event_at is distinct from old.event_at or new.event_place is distinct from old.event_place or new.cover_file_id is distinct from old.cover_file_id
    or new.slug is distinct from old.slug;
  -- Editar conteúdo aprovado/publicado invalida a aprovação: volta a rascunho (18: sem alteração retroativa).
  if content_changed and o in ('approved', 'scheduled', 'published') and o = n then
    new.status := 'draft';
    n := 'draft';
  end if;
  if o = n then
    return new;
  end if;
  allowed := case o
    when 'draft'              then n in ('review', 'archived')
    when 'review'             then n in ('approved', 'changes_requested', 'draft', 'archived')
    when 'changes_requested'  then n in ('draft', 'review', 'archived')
    when 'approved'           then n in ('scheduled', 'published', 'draft', 'archived')
    when 'scheduled'          then n in ('published', 'approved', 'draft', 'archived')
    when 'published'          then n in ('unpublished', 'draft')
    when 'unpublished'        then n in ('draft', 'published', 'archived')
    when 'archived'           then n in ('draft')
    else false
  end;
  if not allowed then
    raise exception 'transição de conteúdo inválida: % → %', o, n using errcode = '23514';
  end if;
  if n = 'scheduled' and new.scheduled_for is null then
    raise exception 'agendamento exige data/hora' using errcode = '23514';
  end if;
  -- Aprovar/publicar/despublicar: só aprovadores (admin/coordenação) e nunca o próprio autor aprova (18),
  -- exceto experiência publicada direto por publish_experience() (EXP-001).
  if n in ('approved', 'published', 'scheduled', 'unpublished') and auth.uid() is not null then
    if not public.has_global_role('admin', 'coordination') then
      raise exception 'aprovação e publicação são da coordenação/administração' using errcode = '42501';
    end if;
    if n = 'approved' and new.author_id = auth.uid() and not direct then
      raise exception 'autor não aprova o próprio conteúdo' using errcode = '42501';
    end if;
  end if;
  if n in ('review', 'approved', 'published') and not new.consent_confirmed and new.cover_file_id is not null then
    raise exception 'capa exige consentimento confirmado antes de revisar/publicar' using errcode = '23514';
  end if;
  perform public.log_audit('content.' || n, 'content_item', new.id::text, 'ok', jsonb_build_object('from', o, 'locale', new.locale, 'type', new.type, 'direct', direct));
  return new;
end $$;

-- Publica (ou republica, para valer capa/galeria novas) uma experiência num passo só.
create or replace function public.publish_experience(p_item uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  st text;
  kind public.content_type;
  pub_id uuid;
begin
  if not public.has_global_role('admin', 'coordination') then
    raise exception 'publicação é da coordenação/administração' using errcode = '42501';
  end if;
  select status::text, type into st, kind from public.content_item where id = p_item for update;
  if st is null then
    raise exception 'conteúdo não encontrado' using errcode = 'P0002';
  end if;
  if kind <> 'experience' then
    raise exception 'publicação direta só vale para experiências' using errcode = '42501';
  end if;
  perform set_config('ferrosite.direct_publish', 'on', true);
  -- mesmo caminho de estados do fluxo normal (o trigger valida cada passo), sem a segunda pessoa
  if st in ('published', 'archived') then
    update public.content_item set status = 'draft', updated_by = auth.uid() where id = p_item;
    st := 'draft';
  end if;
  if st in ('draft', 'changes_requested') then
    update public.content_item set status = 'review', updated_by = auth.uid() where id = p_item;
    st := 'review';
  end if;
  if st = 'review' then
    update public.content_item set status = 'approved', updated_by = auth.uid() where id = p_item;
  end if;
  pub_id := public.publish_content(p_item);
  perform set_config('ferrosite.direct_publish', 'off', true);
  perform public.log_audit('publication.direct', 'content_item', p_item::text, 'ok', jsonb_build_object('publication', pub_id));
  return pub_id;
end $$;

revoke all on function public.publish_experience(uuid) from public, anon;
grant execute on function public.publish_experience(uuid) to authenticated;

-- Pasta de fotos do Drive humano de onde a experiência importa (para "Buscar fotos novas da pasta").
-- Só metadado interno: não entra no snapshot nem na projeção pública.
alter table public.content_item add column photo_folder_id text not null default ''
  check (photo_folder_id = '' or photo_folder_id ~ '^[A-Za-z0-9_-]{10,}$');
