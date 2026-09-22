-- PROJ-001 (complemento): expõe created_at na projeção pública para ordenar o hub pela ordem de cadastro
-- (a relação de projetos foi cadastrada na ordem informada pela coordenação), sem inventar prioridade.
-- create or replace view só permite acrescentar colunas ao final — created_at entra após cover_file_id.
create or replace view public.public_project with (security_invoker = false) as
  select p.id, p.slug, p.name, p.name_en, p.summary, p.summary_en, p.description_md, p.description_md_en,
         p.category, p.status, p.starts_on, p.ends_on, p.updated_at,
         (select pf.file_id from public.project_file pf join public.file_asset f on f.id = pf.file_id
           where pf.project_id = p.id and pf.kind = 'cover' and f.status = 'verified' and f.classification = 'public' and f.consent in ('granted', 'not_required')
           limit 1) as cover_file_id,
         p.created_at
    from public.project p
   where p.classification = 'public' and p.status::text in ('planned', 'active', 'paused', 'completed');
