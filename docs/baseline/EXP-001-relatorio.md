# EXP-001: experiências criadas e publicadas pelo Portal

Data: 2026-10-15 · Pedido: "como conseguiria adicionar novas experiências no site, sem necessariamente pedir para você? De forma simples no portal do admin/coordenador."

## Decisões do usuário

- **Publicação direta:** administração e coordenação publicam experiências sem segunda aprovação. O resto do conteúdo (notícias etc.) continua com aprovação por outra pessoa.
- **Autorização das fotos:** uma confirmação por experiência ("tenho autorização para usar estas fotos no site, inclusive as que mostram pessoas"). As fotos entram visíveis e cada uma pode ser ocultada.

## Fluxo

| Passo | Onde | O que acontece |
|---|---|---|
| 1. Nova experiência | `/portal/experiencias/nova` | Uma tela só: tipo (visita técnica, palestra, evento), nome, data, local, resumo, texto, projeto, link da pasta de fotos no Drive e a caixa de autorização. O tipo vira o começo do título ("Visita técnica: …"), que é como o site classifica (`experienceKind`). |
| 2. Importação | `/portal/experiencias/[id]` | Abre importando a pasta sozinha, em lotes de 5 com barra de progresso (`importBatch`). Cada foto vira cópia no Drive do Portal, registrada como pública e com o consentimento marcado como dado, mais uma nota de quem autorizou e quando. A **descrição** sai do nome do arquivo (`Grupo_com_locomotiva.jpg` → "Grupo com locomotiva"). Nomes de câmera viram "<título> (foto N)". |
| 3. Fotos | mesma página | ★ capa, "Ocultar do site" (troca o vínculo para `attachment`; só `gallery` é publicado) e descrição editável. |
| 4. Publicar | mesma página | "Publicar no site", que depois vira "Atualizar no site". Mudar fotos, capa ou texto volta o item a rascunho (regra antiga do banco): o site mantém a versão anterior até "Atualizar". "Tirar do site" despublica. |
| Depois | mesma página | "Buscar fotos novas da pasta" é idempotente pelo md5: só importa o que ainda não está no acervo. |

## Banco (migration `20261015000100_experience_direct_publish`)

- **`publish_experience(p_item)`**: só admin/coordenação e só `type = 'experience'`. Percorre os mesmos estados do fluxo normal (rascunho → revisão → aprovado, validados pelo trigger) com a GUC local `ferrosite.direct_publish` ligada e chama `publish_content`. Auditoria `publication.direct`.
- **`guard_content_status`** recriada com uma única exceção: com a GUC ligada **e** tipo experiência, o autor que é admin/coordenação pode aprovar. Ligar a GUC à mão numa notícia não adianta (teste).
- **`content_item.photo_folder_id`**: id da pasta do Drive humano, com check de formato. Metadado interno, fora do snapshot e da projeção pública.

## Outras mudanças

- `listFolder` do Drive pagina até 1000 itens. Antes parava em 100 sem avisar.
- Aviso na **Minha mesa** quando o Drive está desconectado ou com erro (`DriveDownAlert`), com o botão "Reconectar o Drive". Antes o site ficava sem fotos sem que ninguém soubesse.

## Testes

- Unit `tests/unit/experiences.test.ts`: título com tipo (compatível com `experienceKind`) e descrição a partir do nome do arquivo.
- RLS `tests/rls/experiences-direct.test.ts`:
  - membro não publica;
  - notícia não usa o atalho;
  - autor admin publica num passo;
  - ocultar a foto volta a rascunho e o site só muda ao republicar;
  - fora da função (mesmo com a GUC ligada) o autor não aprova;
  - formato da pasta.
- Suíte completa: unit 247, RLS 109, lint, typecheck e build.
- E2E: não rodado. O projeto Supabase de testes (TEST-001) ainda não foi configurado, e o e2e se recusa a rodar contra a produção.

## Dados

- **FTC:** as fotos novas (77, trocadas no Drive em 14/10) entram pelo fluxo novo: pasta `2026-1/2/FTC (15/05)/FOTOS`.
- **RUMO Araucária (23/09):** experiência nova pelo fluxo novo, pasta `2026-1/2/RUMO LOGISTICA 23/09` (72 fotos). O texto sai só do relatório `Relatorio_Visita_RUMO_Araucaria_2026`, sem o nome da egressa que guiou a visita.
