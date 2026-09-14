# Migração do projeto atual

## Estratégia

Strangler incremental, não big bang. Capturar baseline; criar shells e fundações ao lado; migrar uma rota/fatia; comparar; redirecionar; remover legado somente depois de paridade e observação.

## Sequência segura

1. Resolver instalação e registrar lint/build/screenshots/links.
2. Testar invariantes dos currículos e manter PDFs/HTMLs como fallback.
3. Colocar conteúdo hard-coded em inventário/quarentena.
4. Tornar root layout mínimo e criar `(public)`/`(portal)` sem alterar URLs.
5. Introduzir tokens, i18n e tema com página de laboratório de componentes.
6. Implementar auth/RLS/schema em ambiente de desenvolvimento.
7. Entregar Projeto+Membership+Missão vertical.
8. Migrar fluxograma com feature flag e comparação lado a lado.
9. Migrar páginas públicas uma a uma, começando por Home/Curso.
10. Criar publicação Portal→site; então substituir arrays.
11. Adicionar módulos institucionais por valor/risco.
12. Remover código/assets duplicados após relatório de uso.

## Compatibilidade e rollback

- migrations aditivas antes de destrutivas; expand/migrate/contract;
- backups/restore testado antes de dados reais;
- feature flag server-side para fatias; rollback não perde dados;
- redirects permanentes para slugs/rotas alterados;
- HTMLs curriculares removidos de `public` só após confirmar ausência de links externos.

## Inventário a preservar durante migração

Três currículos e optativas; PDFs/HTML; logo; empresa logos até decisão; vídeo até substituto; narrativa existente como material a validar; rotas antigas com redirects; metadados básicos.

## Conteúdo

Não importar arrays atuais automaticamente. Produzir planilha/coleção de staging com origem, status `UNVERIFIED`, responsável e decisão: confirmar/corrigir/descartar.
