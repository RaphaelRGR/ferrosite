# Decisões e conflitos encontrados

## Decisões firmes

1. Preservar App Router/TS strict/Tailwind/Supabase como direção inicial; Supabase só é confirmado após schema/RLS/prova vertical.
2. Não reescrever tudo; migrar incrementalmente.
3. Separar shells antes do redesign.
4. Segurança/RLS antes de dados reais/dashboard.
5. Site claro; Portal dual-theme; logo oficial.
6. Conteúdo público é projeção aprovada.
7. Fluxograma permanece interativo e com três matrizes.
8. “Atrasada” é condição derivada; “atividade” não é “missão”; auditoria não é diário.

## Conflitos factuais/editoriais

- `AboutHistory` diz fundação em 2014; `StoryJourney` diz 04/08/2009.
- “Único no Brasil”, “único de Santa Catarina” e “primeiro no Sul” aparecem como afirmações distintas.
- CREA: “dupla atribuição”, “sem restrições” e Art. 12 precisam validação jurídica/institucional.
- Investimentos R$ 600 bi/R$ 103 bi e 30 mil km não têm fonte no repositório.
- 15+ projetos, 48 visitas, 1,2 mil alunos e três países não têm fonte.
- Empresas aparecem como parceiras e destinos de egressos na mesma faixa; relações não equivalentes.
- Notícias/eventos/visitas 2022–2026 e pessoas dos mockups não são dados confirmados.
- **BASE-002 (2026-09-14):** todos os itens acima estão inventariados em `content/editorial-inventory.json` com status UNVERIFIED e marcados no site com o selo "Conteúdo em verificação"; a tabela de conflitos consolidada está em `docs/baseline/BASE-002-relatorio.md`.

## Conflitos de escopo

- Briefing exige site público integral PT/EN; guia diz “principais áreas do Portal” também. Decidir extensão do Portal no MVP, mantendo fundação traduzível.
- `/portal/questoes` e `/simuladores` existem como placeholders, mas não aparecem na IA central. Não remover sem decisão.
- Portfólio lista LABMCI/LASC/IDA Lab sem páginas; faltam dados.
- LabDSE e Robótica compartilham texto quase idêntico no PDF; diferenciar com responsáveis.
- Aplicações LDTPav são descritas como potencial; não divulgar como ensaio oferecido sem confirmação.
- Mockups só mostram Portal claro/desktop; dark/mobile precisam projeto próprio.

## Riscos técnicos explícitos

- reduced motion deixa manifesto invisível e parte da jornada esmaecida.
- EMB5512/2012 depende de EMB5107, presente apenas nas optativas hoje não renderizadas.
- `referencias_ferro/` está fora do Git; decidir LFS/acervo/documentação.
- HTMLs legados públicos duplicam dados e usam inline handlers; remoção pode quebrar links externos.
- instalação inicialmente travou sem saída; a segunda execução passou. TypeScript e build passam, mas lint falha com 11 erros/14 avisos.
- `npm audit --omit=dev` reporta 5 vulnerabilidades de produção, incluindo Next 16.2.4 como crítica; correção indicada em 16.3.5 deve ser aplicada antes de qualquer release.
- **Atualização BASE-001 (2026-09-14):** Next atualizado para 16.3.5; audit zerado; lint zerado; reduced motion do manifesto/jornada corrigido com teste. Ver `docs/baseline/BASE-001-relatorio.md`.
- Matriz 2012: `EMB5605` (fase 6) declara pré-requisito `EMB5116` (também fase 6). HTML legado repete o dado; PDF não conferido. `[CONTEÚDO PENDENTE]` para FLOW-001; registrado como exceção conhecida no teste de invariantes.
- Matriz 2016: slots `OPT-1..OPT-4` ("Optativa Obrigatória I–IV") estão entre as obrigatórias das fases 8–9; a contagem 61 os inclui. Decidir modelagem em FLOW-001.
- **FLOW-001 (2026-09-15):** os PDFs oficiais são a fonte canônica; os slots I–IV constam no PDF de 2016 (fases 8–9). O PDF de 2012 não traz pré-requisitos: as arestas de 2012 (incl. EMB5512→EMB5107 e EMB5605→EMB5116, ambas fase 6) são legadas e aguardam a coordenação. Ver `docs/baseline/FLOW-001-002-relatorio.md`.
- **LAB-001 (2026-09-15):** Robótica Avançada tem, no PDF, corpo idêntico ao LabDSE → nada publicado além de nome/responsável até validar o diferencial. Aplicações do LDTPav são 100% prospectivas → selo "Potencial de aplicação", nunca serviço. LABMCI/LASC/IDA Lab só no índice → páginas com pendência, sem responsável inventado. Contatos do PDF nunca copiados. Texto do portfólio verbatim (typo 'characterização' e bio no LAV) registrado no inventário para decisão do owner. Ver `docs/baseline/LAB-001-relatorio.md`.
- **PORTAL-002/003 (2026-09-15):** cadeia de estados fixada no servidor (10 'sugestão inicial'), com `draft` inicial e `cancelled` terminal; concorrência por `version` (conflito devolve mensagem, nunca sobrescreve); `supabase gen types` exige Docker → gerador próprio a partir do Postgres embutido (`scripts/db-types-local.mjs`). Convite/aceite ficam no Supabase Auth; Pessoas cobre ativação/papel/desativação. Ver `docs/baseline/AUTH-003-PORTAL-002-003-relatorio.md`.
- **CRM-001 (2026-09-15):** envio público de desafio via service role no servidor (função restrita) em vez de RPC anônimo, para que o hash de origem não seja forjável; sem anexos até FILE-001; retenção dos dados `[CONTEÚDO PENDENTE]`; sem notificação por e-mail (provedor não aprovado). Ver `docs/baseline/CRM-001-relatorio.md`.

## Perguntas realmente bloqueadoras

1. Quais alegações/números/datas/parcerias são oficiais e quem aprova?
2. Qual é a fonte curricular canônica e quem valida divergências?
3. Qual política de login, papéis, domínio UFSC e acesso externo?
4. Supabase e Google Drive estão aprovados? Quais ambientes/escopos/retensão?
5. Qual conteúdo do Portal precisa PT/EN no primeiro release?
6. `Questões` e `Simuladores` continuam?
7. Quais fotos/logos têm direitos e consentimento, e onde estão os originais?
8. Quem pode aprovar publicação, P&D, financeiro e dados pessoais?

Não bloqueiam BASE-001, shells, tokens, testes ou protótipo com fixtures isoladas. Bloqueiam publicação de fatos, políticas finais e ingestão de dados reais.
