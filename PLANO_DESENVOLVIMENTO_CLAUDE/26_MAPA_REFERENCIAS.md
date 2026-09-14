# Mapa das referências

## Telas públicas

| Arquivo | Conteúdo/página sugerida | Elementos bons | Elementos ruins/riscos | Reutilização |
|---|---|---|---|---|
| `telas principais/ChatGPT Image 14 de set. de 2026, 11_06_57 (1).png` | Home | header claro, hero dividido, ritmo editorial, frentes, projetos, mapa, parceiros | texto minúsculo, densidade alta, números/logos fictícios | hierarquia e alternância de seções |
| `telas principais/ChatGPT Image 14 de set. de 2026, 11_06_57 (2).png` | O Curso | hero humano, dados básicos, pilares, trajetória, labs, vida e carreira | fluxograma mostrado como resumo estático; conteúdo não validado | composição; não substituir fluxo real |
| `telas principais/ChatGPT Image 14 de set. de 2026, 11_06_58 (3).png` | Projetos | hub com filtros, destaque e cards variados | status/métricas/pessoas fictícios; muitos cards | arquitetura do hub e detalhe destacado |
| `telas principais/ChatGPT Image 14 de set. de 2026, 11_06_59 (4).png` | Experiências | hero fotográfico, Brasil/internacional, mapa/timeline, oportunidades | números/destinos fictícios; mapa sem alternativa visível | narrativa e agrupamento de experiências |
| `telas principais/ChatGPT Image 14 de set. de 2026, 11_06_59 (5).png` | Notícias/Comunidade | manchete, categorias, perfis, agenda, Instagram | pessoas/notícias/datas fictícias; excesso de microcards | ritmo editorial e integração comunidade |
| `telas principais/ChatGPT Image 14 de set. de 2026, 11_12_09.png` | Para Empresas/P&D | proposta direta, labs, capacidades, casos e CTA | dados de impacto/casos/logos não comprovados; cards pequenos | jornada problema → capacidade → contato |

Todos têm 941×1672, exceto `11_12_09.png` (1024×1536). São mockups, não assets de produção.

## Telas do Portal

| Arquivo | Conteúdo | Bons | Riscos | Função |
|---|---|---|---|---|
| `portal/ChatGPT Image 14 de set. de 2026, 11_19_35 (1).png` | Dashboard | sidebar, busca, ação/indicadores, projetos, agenda, atividade | números/pessoas fictícios; somente desktop/claro | referência de composição por perfil |
| `portal/ChatGPT Image 14 de set. de 2026, 11_19_36 (2).png` | Hub Projetos | filtros, destaque, modelos rápidos, status | densidade e cards; permissões invisíveis | hub operacional |
| `portal/ChatGPT Image 14 de set. de 2026, 11_19_37 (3).png` | Projeto detalhe | header, tabs, progresso, equipe, roadmap, galeria | todos módulos simultâneos; dados fictícios | modularidade por projeto |
| `portal/ChatGPT Image 14 de set. de 2026, 11_19_37 (4).png` | Missões | Kanban/lista/calendário, contadores, agenda | drag implícito, mobile ausente, estado só por cor | visões da mesma entidade |
| `portal/ChatGPT Image 14 de set. de 2026, 11_19_39 (5).png` | Pessoas/permissões | tabela, detalhe, convite e toggles | precedência de permissão não definida; PII fictícia | fluxo administrativo, não política |
| `portal/ChatGPT Image 14 de set. de 2026, 11_19_39 (6).png` | Relatórios | filtros, indicadores, gráficos, preview/export | fórmulas/fontes inexistentes, gráfico decorativo possível | relatório com preview e fonte |

Todos medem 1448×1086. Nenhum especifica dark mode, mobile, erros, loading, vazios, sem permissão ou concorrência.

## Identidade

`LOGOS DE FERROCOMUNICA (1).png` (1080×1080): símbolo/wordmark oficial indicado. Bom: marca distintiva, trilhos sutis, laranja. Riscos: raster, grande área branca, possível falta de versões. Reutilizar somente preservando proporção; solicitar SVG e manual.

## Portfólio de laboratórios — páginas e imagens

| Página | Conteúdo visual | Uso sugerido | Bom | Problema/pendência |
|---:|---|---|---|---|
| 1 | capa UFSC + marca EFM | fonte institucional | identificação clara | não é hero web |
| 2 | apresentação/lista de 14 labs | índice de conteúdo | mapa abrangente | cita LABMCI/LASC/IDA sem páginas |
| 3 | LMSE: instrumentação, ensaio, responsável | página LMSE | equipamento real | originais/créditos/sala pendentes |
| 4 | LMS: máquinas geotécnicas, responsável | página LMS | infraestrutura real | validar disponibilidade/contato |
| 5 | LabDSE: metrologia, Stewart, responsável | página LabDSE | diversidade técnica | texto cru denso |
| 6 | Robótica: plataformas/equipe/responsável | página Robótica | ambiente real | texto repete LabDSE; diferenciar |
| 7 | NSO: computadores/VR/responsável | página NSO | computação aplicada | contato pessoal; evidências |
| 8 | LaCMa: instrumentos/material/responsável | página LaCMa | capacidade real | originais e termos a revisar |
| 9 | LIFE: túnel/estrutura/responsável | página LIFE | infraestrutura expressiva | números financeiros precisam fonte |
| 10 | Aeolus: túnel de vento/responsável | página Aeolus | forte imagem técnica | especificações precisam validação |
| 11 | LTS: equipe/soldagem/responsável | página LTS | dimensão humana | foto de equipe exige consentimento |
| 12 | LAV: bancada/medição/responsáveis | página LAV | aplicação clara | parceria/patente/citações validar |
| 13 | LDTPav: equipamentos/responsáveis | página LDTPav | infraestrutura real | aplicações ferroviárias são potenciais |

Arquivo: `Portfolio_Laboratorios_EFM_UFSC.pdf`, A4, 13 páginas, ~11,4 MB. Usar como fonte de descoberta; solicitar texto revisado, fotos originais, créditos, Lattes/URLs e confirmação de contatos.

## Guia

`GUIA_REDESIGN_PORTAL_FERROVIARIA.md` foi lido integralmente. Ele define visão e produto, não arquitetura técnica. Conflitos/decisões estão em `33`; dados exemplificativos não são fatos.

## Assets atuais fora de `referencias_ferro`

- `public/videos/hero.mp4`: visual atual, 35 MB; usar só após recodificação/poster/política.
- `public/empresas/*.png`: logos existem, mas presença não prova parceria; validar direito/contexto.
- `public/grades/*`: três PDFs e HTMLs; preservar como fallback até paridade.
- `public/logo-icon.png` e `public/images/about/hero-bg.png`: não usados; avaliar antes de remover.
