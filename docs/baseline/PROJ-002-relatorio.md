# PROJ-002: projetos do curso como permanentes

Data: 2026-10-15 · Pedido: "os projetos do curso são fixos, não ficam adicionando e tirando; na aba admin eles estão lá como coisas temporárias, o que não é."

## Decisão do usuário

Tirar as **datas de início/fim** e o **botão "Novo projeto"**. A situação (Ativo etc.), as transições e o alerta "sem atualização há 30 dias" ficam como estão.

## Entregue

- **Datas:**
  - `ProjectForm` não pede mais Início/Fim, e a página do projeto no Portal não mostra mais "Período";
  - `readProjectFields` (`lib/portal/actions/projects.ts`) deixou de gravar `starts_on`/`ends_on`. As colunas ficam no banco sem uso, sem migration e sem apagar valores antigos;
  - a página pública do projeto já não mostrava datas.
- **Novo projeto:** saiu do cabeçalho de `/portal/projetos`. No fim da lista ficou o link discreto "Cadastrar novo projeto do curso", **só para admin**. A rota `/portal/projetos/novo` e a permissão de criar (`canCreateProject`) não mudaram.

## Testes

Typecheck e unit. O e2e `portal-journey` abre `/portal/projetos/novo` direto e não dependia do botão.
