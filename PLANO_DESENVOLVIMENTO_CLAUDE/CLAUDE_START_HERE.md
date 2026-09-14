# Manual inicial para Claude Code

## O que é este projeto

Um protótipo Next.js que deve evoluir para dois produtos integrados: site público bilíngue e Portal operacional seguro. O redesign completo não foi implementado nesta fase. As referências são direção, não especificação pixel-perfect, e seus dados de mockup são fictícios.

## Leia nesta ordem

`00` → `01` → `33` → `02` → `03` → `20` → `21` → `06/06A` → `24` → `28` → `29` → `30`. Antes de cada fatia, leia o documento do domínio e `27/31`.

## Regras de execução

1. Comece por `BASE-001`; não redesenhe antes de obter baseline reproduzível.
2. Preserve mudanças do usuário e `referencias_ferro/`; não mova/remova sem decisão.
3. Faça uma tarefa do backlog por vez ou um conjunto pequeno explicitamente dependente.
4. Antes de editar, liste arquivos afetados, invariantes e testes.
5. Server Component por padrão; Client Component somente onde há interação real.
6. Não criar abstração/framework interno antes de dois usos concretos.
7. Não adicionar dependência sem registrar problema, alternativas, custo de bundle/manutenção e licença.
8. Não publicar mock data; use fixtures isoladas em teste/dev e `[CONTEÚDO PENDENTE]` editorial.
9. Comentários explicam por quê, risco ou invariantes; remover narração óbvia.
10. Toda rota/controle novo inclui loading, vazio, erro, sem permissão e responsividade.

## O que não pode quebrar

- três matrizes e relações curriculares;
- site público existente durante migração incremental;
- isolamento por projeto e menor privilégio;
- aprovação antes da projeção pública;
- preferência de tema entre páginas/sessões;
- PT/EN integral do site e SEO localizado;
- memória de projetos concluídos.

## Fases

Baseline → shells/tokens/i18n → auth/RLS → primeira fatia Projeto/Missão → fluxograma → conteúdo público → publicação → módulos institucionais → acabamento. Consulte `29` para gates.

## Como testar

Em cada tarefa: lint + typecheck + unit/integration + build; E2E dos fluxos afetados; axe/teclado; viewports definidos; ambos os temas se Portal; PT/EN se público; autorização positiva e negativa se dados privados. Registre comandos/resultados.

## Quando parar e revisar

Pare se faltar decisão que altera modelo, permissão, conteúdo oficial, dado pessoal, contrato de integração ou rota pública. Pare também ao detectar divergência curricular, necessidade de segredo, migration destrutiva ou alteração fora da tarefa. Não contorne segurança para avançar.

Uma fase só termina com demo verificável, aceite de `31`, dívida registrada e documentação atualizada. Ao concluir toda implementação, entregar ao Codex para executar `32_CHECKLIST_CODEX_REVISAO_FINAL.md`.
