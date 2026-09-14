# Comece aqui

## Entregável e limite desta etapa

Esta pasta é o contrato de planejamento para transformar o protótipo atual na plataforma digital da Engenharia Ferroviária e Metroviária da UFSC Joinville. Ela foi produzida a partir do código real, dos assets em `public/`, das três grades, de todo o diretório `referencias_ferro/`, do guia mestre e do briefing. Esta etapa não implementa o redesign.

Data da auditoria: 2026-09-14. Estado Git observado: branch `main`; `referencias_ferro/` não rastreada. Não assumir que esse diretório existirá em outro clone até ser definida sua política de versionamento.

## Diagnóstico executivo

- O repositório é um protótipo visual Next.js 16.2.4/React 19/Tailwind 4/TypeScript estrito.
- Existem seis páginas públicas visualmente elaboradas: Home, Curso, Sobre, Visitas, Eventos e Notícias. `Simuladores` é placeholder.
- O Portal é um esqueleto: Dashboard, Projetos, Questões e Acervo só exibem títulos/TODOs.
- A autenticação não funciona: o callback não troca o código por sessão e as rotas `/portal/**` não são bloqueadas.
- O fluxograma curricular é a funcionalidade mais madura e deve ser preservado: três matrizes (2025, 2016, 2012), seleção, hover de pré-requisitos e modal.
- Conteúdo, datas, métricas, parcerias e notícias aparecem hard-coded e vários itens não possuem fonte. Colocar em quarentena editorial; usar `[CONTEÚDO PENDENTE]`.
- A identidade atual usa emoji no header, embora exista logo oficial nas referências.
- O shell público envolve o Portal, criando navegação/footer públicos e landmarks `<main>` aninhados.
- Não existe i18n, dual theme, modelo de dados, migrations, RLS, testes ou CI.
- A auditoria de dependências encontrou 5 vulnerabilidades em produção (1 crítica, 3 altas, 1 moderada); o pacote direto Next 16.2.4 tem correção indicada pelo audit em 16.3.5. Atualizar e revalidar é P0.

## Invariantes: não quebrar

1. Preservar as matrizes 2025, 2016 e 2012 e validar seus dados antes de migrar.
2. Preservar seleção de disciplina, relações de pré-requisito e detalhes; ampliar para toque, teclado e dependentes.
3. Não publicar dados internos diretamente. O site consome somente projeções aprovadas.
4. Não apresentar números, pessoas, empresas, eventos ou resultados sem fonte e autorização.
5. Autorização deve existir no servidor/banco; esconder UI não é controle de acesso.
6. Site público nasce PT/EN. Portal nasce com tokens para claro/escuro e preferência persistente.
7. Projetos concluídos são memória institucional: arquivar, não apagar.
8. Implementar em fatias verticais pequenas, com teste e aceite verificável em cada fase.

## Ordem de leitura para implementação

1. `CLAUDE_START_HERE.md`
2. `01_AUDITORIA_PROJETO_ATUAL.md`
3. `33_DECISOES_E_CONFLITOS_ENCONTRADOS.md`
4. `02_VISAO_DO_PRODUTO.md`
5. `03_ARQUITETURA_DA_INFORMACAO.md`
6. `20_MODELO_CONCEITUAL_DOS_DADOS.md`
7. `21_SEGURANCA_PRIVACIDADE_E_AUDITORIA.md`
8. `06_DESIGN_SYSTEM_E_DIRECAO_VISUAL.md` e `06A_TEMA_CLARO_E_ESCURO_DO_PORTAL.md`
9. `24_INTERNACIONALIZACAO_PT_EN.md`
10. `28_MIGRACAO_DO_PROJETO_ATUAL.md`
11. `29_ROADMAP_DE_IMPLEMENTACAO.md`
12. `30_BACKLOG_CLAUDE_CODE.md`
13. Documento do domínio em implementação.
14. `31_CRITERIOS_DE_ACEITACAO.md` e `27_TESTES_E_QUALIDADE.md` antes de concluir cada fatia.

## Primeira tarefa do Claude

Executar `BASE-001`: criar uma baseline reproduzível sem mudar o visual. Atualizar Next e dependências para versões sem os advisories atuais, corrigir lint, manter typecheck/build verdes; criar testes de invariantes dos currículos e smoke das rotas; capturar screenshots de regressão; inventariar links e falsas ações. Só depois separar os shells público/Portal. Não iniciar Home nova, dashboard ou banco antes dessa baseline.

## Gates de decisão humana

- Validar fontes e responsável editorial para todas as alegações públicas.
- Confirmar se `/portal/questoes` e `/simuladores` permanecem no produto.
- Definir escopo PT/EN do Portal; o site público é integralmente bilíngue.
- Confirmar estratégia de login, domínio de e-mail e convite de externos.
- Confirmar Supabase como backend e disponibilizar projeto/ambientes sem expor segredos.
- Definir política do Google Drive, consentimento de imagem, retenção e LGPD.
- Aprovar taxonomia de projetos, missões, capacidades e indicadores.
- Fornecer originais de fotos/logos e autorizações de uso.

## Sinal de conclusão do programa

O programa só termina quando os critérios de `31` passam, os riscos P0/P1 estão resolvidos, o checklist `32` foi executado pelo Codex e não existem ações falsas, dados fictícios como fatos, vazamento entre projetos ou regressão nas três matrizes.
