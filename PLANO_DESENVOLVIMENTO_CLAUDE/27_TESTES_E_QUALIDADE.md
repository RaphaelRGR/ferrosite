# Testes e qualidade

## Pipeline obrigatório

`npm ci` → lint → `tsc --noEmit` → unitários → integração/RLS → componentes → Playwright desktop/mobile → axe → link checker → Lighthouse CI → build. Falha bloqueia merge; exceção tem owner, prazo e risco.

## Pirâmide

- Unitário: grafo curricular, estados/transições, permissões, indicadores, formatação i18n.
- Integração: repositories, RLS, publication projection, upload, callback/session.
- Componente: Dialog, Table, Kanban, ThemeSelector, Form, Flowchart node/panel.
- E2E: jornadas públicas e de cada perfil; positivos e negativos.
- Visual: viewports 375×812, 768×1024, 1366×768, 1440×900; Portal claro/escuro; estados.

## Cenários de alto risco

Anônimo em Portal; membro de outro projeto; externo expirado; sessão revogada; dupla submissão; edição concorrente; aprovação corrida; Drive revogado; relatório sem dados; conteúdo EN ausente; tema antes da hidratação; reduced motion; sem JS no público; fluxograma nas três matrizes e orientação móvel.

## Dados de teste

Fixtures sintéticas, explicitamente marcadas, sem copiar nomes/emails/números dos mockups. Ambientes e seeds separados; testes de autorização criam pelo menos projetos A/B e usuários com papéis diferentes.

## Definition of Done

Aceite objetivo, testes novos, sem regressão, estados completos, docs atualizadas, migração reversível, observabilidade adequada, sem TODO temporário, sem dependência injustificada e sem dados fictícios em produção.
