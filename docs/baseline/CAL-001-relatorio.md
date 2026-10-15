# CAL-001: calendário ferroviário

Data: 2026-10-15 · Pedido: calendário de eventos ferroviários do Brasil e do mundo. Administração e coordenação adicionam e removem; o site mostra sempre o ano corrente; quem edita mexe no ano atual e no próximo; tudo fica salvo a partir de 2026.

## Entregue

| Parte | Onde | Como |
|---|---|---|
| Banco | migration `20261015000200_rail_calendar` | Tabela `rail_event` (nome oficial, início/fim, cidade, país ISO, Brasil/mundo, tipo, site oficial, descrição PT/EN, fonte interna). Ano gerado. Trigger `guard_rail_event_window`: inserir/alterar/remover só no ano corrente e no próximo, pelo fuso America/Sao_Paulo; anos anteriores viram registro. Remoção auditada. RLS só admin/coordenação. View `public_rail_event`: só o ano corrente, sem a fonte. |
| Portal | `/portal/calendario` (menu "Calendário") | Abas do ano atual (selo "No site agora"), do próximo ("Preparando: aparece no site em 1º de janeiro") e anos anteriores (somente leitura). Formulário curto, editar e remover com confirmação. |
| Site | `/pt/calendario`, `/en/calendario` (menu principal) | "Calendário ferroviário 2026", agrupado por mês, filtro Brasil/Mundo no cliente, evento passado esmaecido, link "Site oficial". País pelo código ISO, traduzido no idioma da página. Em EN a descrição só aparece se houver versão em inglês. Revalida a cada 5 min e na hora pelas ações. |
| Cabeçalho | `components/layout/PublicHeader.tsx` | Sete itens: links sem quebra de linha e, entre 1024 e 1280 px, só o logo (sem o nome) para caber. |

## Pré-cadastro de 2026 (pesquisa em 2026-10-15)

Só entraram eventos com data confirmada em fonte oficial ou em comunicado do organizador. A fonte ficou registrada no campo interno de cada evento.

| Evento | Data | Local | Fonte |
|---|---|---|---|
| UITP Summit 2026 | 21 a 23/04 | Dubai | anúncio oficial em uitp.org |
| Asia Pacific Rail 2026 | 6 e 7/05 | Bangkok | comunicado da Terrapinn (organizadora) |
| Rail Live 2026 | 17 e 18/06 | Long Marston (Reino Unido) | raillive.org.uk |
| IX Simpósio de Engenharia Ferroviária | 24 e 25/06 | Campinas | press release da organização (abcm.org.br) |
| 32ª Semana de Tecnologia Metroferroviária | 1 a 4/09 | São Paulo | semanadetecnologia.com.br |
| AREMA 2026 Annual Conference & Expo | 13 a 16/09 | Kansas City | conference.arema.org |
| InnoTrans 2026 | 22 a 25/09 | Berlim | comunicados da Messe Berlin |
| Conferência Internacional de Segurança Ferroviária (IRSC 2026) | 11 a 16/10 | Lisboa | IMT (Portugal) |

**Ficaram de fora:**
- **NT Expo e EXPO Ferroviaria:** são bienais, e a próxima edição de cada uma é em 2027. Um agregador listava a EXPO Ferroviaria em 2026, mas o site oficial diz 2027.
- **Intermodal South America 2026 e Middle East Rail 2026:** o site oficial já mostra outro ano, ou a data oficial não estava legível.
- **Conexão ANPTrilhos 2026 (26/08, Brasília) e Latin Rieles 2026 (5 a 7/05, Antofagasta):** só há fonte de imprensa. Vale cadastrar se a coordenação confirmar.
- **Encontros 2026 do curso** (PDF "Calendario.pdf" no Drive): é a agenda interna do curso, não evento do setor. Fica para decisão (33).

## Testes

- Unit `tests/unit/rail-calendar.test.ts`:
  - virada de ano no fuso do curso;
  - evento passado pelo último dia;
  - agrupamento por mês;
  - faixa de datas sem travessão;
  - país traduzido e Brasil/mundo.
- RLS `tests/rls/rail-calendar.test.ts`:
  - coordenação cadastra no ano atual e no próximo, e em nenhum outro;
  - ano passado não é editado nem removido, e não dá para mover um evento para o passado;
  - membro não vê nem escreve;
  - anônimo vê só o ano corrente, sem a fonte;
  - remoção auditada.
- Produção:
  - `/pt/calendario` com os 8 eventos, filtro Brasil mostrando 2;
  - sem rolagem horizontal a 579 px e sem travessão;
  - cabeçalho numa linha a 1024 e a 1280 px.
