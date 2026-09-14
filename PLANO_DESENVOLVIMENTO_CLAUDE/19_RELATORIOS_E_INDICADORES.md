# Relatórios e indicadores

## Relatórios

Projeto, Extensão, P&D, Visita, Missão, Semestral, Institucional, Parceiro, Prestação de Contas, Portfólio e Participação do Aluno. Template versionado + parâmetros + consulta autorizada + snapshot + arquivo gerado + status. Geração pesada é assíncrona e idempotente.

## Dicionário mínimo de indicadores

| Indicador | Fórmula inicial | Fonte | Observação |
|---|---|---|---|
| projetos ativos | `count(project where state=active)` no instante/período | project | declarar timezone |
| missões concluídas | transições para concluída no período | mission_transition | não usar estado atual apenas |
| taxa de atraso | concluídas após prazo + abertas vencidas / missões com prazo | mission | publicar denominador |
| organizações envolvidas | organizações distintas vinculadas no período | project_organization | “envolvida” requer vínculo definido |
| alunos envolvidos | perfis alunos com membership ativo no período | membership | deduplicar pessoa |
| visitas realizadas | experiências tipo visita em estado realizada | experience | não contar canceladas |
| horas registradas | soma de time_entry aprovado | time_entry | separar lançado/aprovado |
| desafios P&D | recebidos/triados/convertidos por período | research_challenge | mostrar funil |
| captação | soma por estado/fonte/moeda | funding | acesso restrito |

Escolas/pessoas impactadas/investimentos só após definição de evento, unidade, deduplicação e fonte. Sem fonte, mostrar “sem dados”, não zero.

## Exportação

PDF/planilha respeitam permissão e classificação, incluem período, geração, fonte e versão. Relatório histórico não muda quando dados operacionais mudam. Evitar fórmula divergente entre dashboard e exportação.
