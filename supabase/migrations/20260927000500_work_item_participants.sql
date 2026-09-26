-- ACT-003: nomes de quem participa de uma ação.
-- A RLS de `profile` só mostra perfis que dividem projeto com a pessoa; um
-- responsável de fora da coordenação veria o histórico sem nomes. Esta função
-- devolve apenas o nome de exibição (nada além) de quem aparece naquela ação
-- e de quem pode ser mencionado, e só para quem pode ver a ação.
create or replace function public.work_item_participants(p_item uuid)
returns table (id uuid, name text, can_mention boolean)
language sql stable security definer set search_path = public
as $$
  with item as (
    select w.* from public.work_item w where w.id = p_item and public.can_view_work_item(p_item)
  ),
  refs as (
    select owner_id as pid from item union select approver_id from item union select approved_by from item
    union select decided_by from item union select created_by from item
    union select actor_id from public.work_item_event where item_id = p_item and exists (select 1 from item)
    union select author_id from public.work_item_comment where item_id = p_item and exists (select 1 from item)
    union select unnest(mentions) from public.work_item_comment where item_id = p_item and exists (select 1 from item)
    union select p.id from public.profile p where p.status = 'active' and p.global_role in ('admin', 'coordination') and exists (select 1 from item)
  )
  select p.id, coalesce(nullif(p.full_name, ''), p.email), public.profile_can_view_work_item(p_item, p.id)
  from public.profile p join refs r on r.pid = p.id
$$;
revoke all on function public.work_item_participants(uuid) from public, anon;
grant execute on function public.work_item_participants(uuid) to authenticated;
