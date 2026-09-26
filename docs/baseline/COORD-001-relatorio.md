# COORD-001: Central da coordenação

Data: 2026-09-26 · Docs 12 (Coordenação e administração) e guia de redesign §20 · Sem migration

## Objetivo

Permitir que a coordenação acompanhe o curso sem abrir projeto por projeto: uma
**fila orientada à decisão** em que cada alerta explica a regra, mostra a
evidência e oferece a próxima ação, sem classificação opaca.

## O que foi entregue

| Parte | Onde |
|---|---|
| Página `/portal/coordenacao` (admin e coordenação; demais recebem a tela de "não encontrado") | `src/app/(portal)/portal/coordenacao/page.tsx` |
| Item "Coordenação" no menu (logo após Início) e atalho no Início para overseers | `lib/portal/navigation.ts`, `portal/page.tsx` |
| Regras de alerta, puras e testáveis, com limiares em um só lugar (`ALERT_RULES`) | `src/lib/portal/coordination.ts` |
| Leituras (cliente de sessão, RLS) | `src/lib/portal/queries/coordination.ts` |
| Fila de alertas agrupada por regra | `src/components/portal/coordination/AlertQueue.tsx` |
| Valor de indicador compartilhado com Relatórios (antes inline) | `src/components/portal/reports/IndicatorValue.tsx` |
| Textos PT e EN | `portal.coordination` nos dicionários |

Seções da página: **Panorama** (projetos ativos, missões vencidas, conteúdos em
revisão, desafios aguardando triagem, empresas em negociação, pessoas ativas;
cada número leva à lista filtrada), **Fila de decisões**, **Agenda dos próximos
60 dias** (eventos e experiências com data futura em Conteúdos), **Indicadores
dos últimos 90 dias** (mesma fórmula de Relatórios, `compute_indicators`),
**Ações rápidas** e **Como os alertas funcionam** (todas as regras com o limiar).

## Regras

| Regra | Gravidade | Dispara quando | Próxima ação |
|---|---|---|---|
| Missões críticas vencidas | urgente | prioridade alta, prazo vencido, não concluída/cancelada | abrir missão |
| Desafios sem triagem | urgente | recebido há ≥ 3 dias sem triagem | fazer triagem |
| Missões vencidas | atenção | prioridade média/baixa, prazo vencido | abrir missão |
| Projetos sem atualização | atenção | ativo, sem mudança no projeto, missões ou histórico há ≥ 30 dias | abrir projeto |
| Publicações paradas na revisão | atenção | em revisão há ≥ 3 dias | revisar |
| Empresas com próxima ação vencida | atenção | etapa ativa e a próxima ação registrada já passou | registrar contato |
| Empresas sem retorno | atenção | etapa ativa, sem próxima ação e sem interação há ≥ 30 dias | registrar contato |
| Aprovados e não publicados | acompanhar | aprovado há ≥ 7 dias | publicar ou agendar |
| Projetos concluídos sem documento final | acompanhar | concluído sem arquivo "documento oficial" | anexar documento |

Deduplicação: uma entidade gera no máximo um alerta (missão crítica não repete
em "vencidas"; empresa com ação vencida não repete em "sem retorno"). Ordem:
gravidade → ordem das regras → dias decorridos.

Previstas no plano e **ainda sem fonte de dados** (declaradas na própria página):
visita sem relatório pós-visita (não há módulo de visitas no Portal) e
oportunidades/editais (módulo inexistente).

## Decisões

- Sem migration: a Central só lê o que já existe; a RLS já dá visão total a
  admin/coordenação. A página também recusa os demais papéis.
- Limiares em código (`ALERT_RULES`), exibidos na interface. Editá-los pelo
  Portal (com histórico, como pede o doc 12) fica para uma próxima etapa, pois
  exige tabela, RLS e auditoria.
- Como o layout do Portal faz streaming, `notFound()` entrega a tela de "não
  encontrado" com status 200 (mesmo comportamento de Pessoas e Relatórios); o
  teste verifica o conteúdo, não o status.

## Testes

- `tests/unit/coordination.test.ts` (12): cada regra no limiar e abaixo dele,
  deduplicação, ordenação, troca de limiar, agrupamento e textos PT/EN com
  `{threshold}`, `{date}` e `{ago}`.
- `tests/unit/portal-shell.test.ts`: menu com o novo item só para admin/coordenação.
- `tests/e2e/coordination.spec.ts` (2): admin chega pelo atalho do Início, vê
  todas as seções, cada item da fila tem evidência e link interno; conta
  `member` não vê o menu nem o conteúdo.
- Rota adicionada a `tests/helpers/routes.ts` (anônimo → login).
- Conferência visual: claro, escuro e celular (375 px) sem rolagem horizontal.

## Observação sobre os dados atuais

O panorama mostra 29 projetos ativos porque o banco de produção guarda os
projetos `projeto-e2e-*` criados pelos testes. Recomendação mantida: projeto
Supabase separado para testes (ou limpeza das fixtures).
