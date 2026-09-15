# LAB-001 — Capacidades, laboratórios e Para Empresas

Data: 2026-09-15 · Fase F5 · Depende de PUBLIC-001/002, BASE-002 · Fonte: `referencias_ferro/Portfolio_Laboratorios_EFM_UFSC.pdf` (doc 14)

## Entregue

| Item | Como |
|---|---|
| Extração do portfólio | `scripts/labs_from_pdf.py` (pypdf, posicional por bloco) → `content/labs.json` com sha256 do PDF. 11 páginas lidas (p.3–13): seções "O laboratório", "Histórico e projetos", "Aplicações no setor…"; responsável como no PDF. **Nenhum e-mail, telefone, sala, link ou Lattes é copiado** (regex de exclusão + teste). |
| 3 labs só no índice | LABMCI, LASC, IDA Lab: nome como no índice (p.2), sem responsável/texto inventado; página com pendência explícita. |
| Robótica Avançada | corpo da página no PDF é idêntico ao LabDSE → detectado no gerador (`duplicateOf`), nada publicado além de nome/responsável, aviso + link para LabDSE (14: "validar diferencial"). |
| Potencial ≠ capacidade | frases prospectivas ("potencial", "podem ser adaptadas", "aplicável") viram `prospective: true` (LDTPav: 3/3) e aparecem com selo "Potencial de aplicação" + nota; nunca como serviço. |
| Taxonomia | `src/data/capabilities.ts`: 20 capacidades de 14 (PT/EN) e relação **administrada** lab↔capacidade com nível `offered` / `prospective` / `pending` (só pelo nome: LASC, IDA Lab), cada vínculo comentado com a página de origem. Sem busca por texto livre (14 "Triagem P&D"). |
| `/laboratorios` | hub claro com filtro por capacidade como **estado de URL** (`?capacidade=`), `aria-current`, contagem `aria-live`, estado vazio com saída, parâmetro inválido → todas. Cards com sigla, nome, primeira frase do portfólio e selos (nível também em texto). |
| `/laboratorios/[id]` | 28 páginas pré-renderizadas (14 × 2 locales). Cabeçalho (sigla, nome, responsável), 3 seções verbatim do PDF, capacidades linkando ao hub filtrado, **campos pendentes explícitos** (equipamentos, disponibilidade, casos, galeria, contato), nota de fonte com página do PDF, CTA Para Empresas. |
| `/para-empresas` | "Que problema sua empresa precisa resolver?" → passos → áreas de desafio com contagens (descrita / potencial / sem página) → hub filtrado. **Sem formulário e sem e-mail** até CRM-001 (`[CONTEÚDO PENDENTE]`); confidencialidade explicada sem prometer NDA; modalidades pendentes. |
| Navegação | "Para Empresas" no menu primário (03); "Laboratórios" no footer; cards de laboratórios em `/curso` agora linkam para a página (fonte única `src/data/labs.ts`; `LABS` saiu do staging). Sitemap atualizado. |
| Quarentena | 4 seções novas (`laboratorios.hub`, `laboratorios.detalhe` com 11 `person`, `laboratorios.detalhe.conteudo` com 14 entradas, `empresas.capacidades`); inventário: **140 entradas em 54 seções**. |
| EN | UI traduzida; conteúdo editorial só existe em PT → páginas EN mostram pendência por idioma (24), nunca PT como fallback. |

## Validação

`npm run lint` 0/0 (duas advertências pré-existentes corrigidas: `<head>` no root layout com justificativa; parâmetro morto em `PendingPage`) · `npm run typecheck` ok · `npm test` **113/113** (novo `labs.test.ts`: sha256 do PDF, 14 labs, 11 detalhados/3 pendentes, sem contatos, prospectivo = flag, parágrafos íntegros, taxonomia 20/20 PT-EN, vínculos válidos, níveis coerentes) · build ok · `npm run test:e2e` **222/222** (novo `labs.spec.ts`: filtro por URL com nível em texto, detalhe sem contato, Robótica duplicada, LASC pendente, Para Empresas sem form/mailto, curso → lab, EN pendente; smoke/axe/quarentena/links/botões-sem-ação cobrem as 5 rotas novas em PT e EN).

## Decisões

1. Texto do portfólio é publicado **verbatim** sob quarentena, inclusive um typo de origem ("characterização", LaCMa) e uma linha biográfica (LAV) — registrados no inventário para decisão `corrigir`/`descartar` do owner, em vez de edição silenciosa.
2. A relação capacidade↔lab é curadoria inicial derivada das seções "Aplicações"; entra no inventário (`laboratorios.hub.capacidades`) para validação da coordenação.
3. Nomes de professores aparecem como constam no documento institucional (nome + titulação), sem contato; entradas `person` sem `consent_or_license` até confirmação.
4. LABMCI não recebe capacidade (nenhuma das 20 cobre "motores"); LASC/IDA Lab só `pending`.

## Pendências

- Owner do portfólio: validar textos, equipamentos, disponibilidade e consentimento de exibição dos responsáveis (35).
- CRM-001: formulário "Tenho um desafio" com rate limit/validação/auditoria e canal institucional.
- Fotos/galerias por laboratório (FILE-001, 25) e casos autorizados (PUB-001).
