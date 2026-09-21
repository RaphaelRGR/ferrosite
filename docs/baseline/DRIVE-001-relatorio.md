# DRIVE-001 — Google Drive como provedor de bytes

Data: 2026-09-21 · Fora do backlog original (30); gancho registrado em 33 ("credencial do Google Drive") e em FILE-001 ("metadados agora, bytes no Drive"). Docs 17, 21.

## Entregue

| Área | Implementação |
|---|---|
| Cliente | `src/lib/files/drive.ts`: conta de serviço com JWT RS256 assinado por `node:crypto`, token OAuth2 em cache, Drive API v3 por `fetch` — **sem SDK** (três chamadas REST). Escopo `drive.readonly`. `parseDriveId` aceita link de compartilhamento ou fileId (só domínios google.com). Pasta institucional opcional (`GOOGLE_DRIVE_ROOT_FOLDER_ID`): arquivo fora dela é recusado (sobe até 10 níveis de pais). |
| Verificação | Ação **Verificar no Drive** (dono/overseer; RLS decide): existência, lixeira, acesso da conta de serviço, pasta raiz, allowlist de tipo; grava nome/MIME/tamanho/md5 do provedor e marca `verified`. Migration 8: trigger registra `verified_by`/`verified_at` e audita `file.verified` (hash/tamanho/MIME); **trocar o id no provedor volta a `registered`** (verificação nunca sobrevive à troca do arquivo). |
| Acesso no Portal | `/portal/arquivos/[id]/original` (`?baixar=1` para download) e `/miniatura`: sessão ativa + RLS (`getFile`) + auditoria `file.access`; bytes por **proxy** (MIME do banco, `nosniff`, `Content-Disposition` seguro, Range repassado, 500 MB máx., `no-store`). Revogado/arquivado ⇒ 404; sem credencial ⇒ 503 e a UI mantém a pendência. Nenhum link do Drive sai do servidor. |
| Capa pública | `publication.cover_file_id` (snapshot) + coluna na `public_publication`; função `public_file_info` (service role) só devolve arquivo **verificado, público, com consentimento, de tipo de galeria e capa de publicação viva**. Rota `/api/midia/[id]` serve por proxy com cache público de 5 min; qualquer condição a menos ⇒ 404 sem distinguir. Site renderiza `<img>` só quando o banco confirma (`publicCoverUrl`), com `alt` e crédito; caso contrário mantém a nota de capa pendente. |
| UI | Página do arquivo: miniatura (imagens), Abrir/Baixar, dados da verificação, botão de verificação, aviso de capa pública; registro aceita link do Drive. `/api/health` expõe `driveConfigured`. |

## Validação

`npm run lint` 0/0 · `npm run typecheck` ok · `npm test` **153/153** (novo `drive.test.ts`: env PEM/base64, parse de links, JWT verificado com chave pública, cache de token e Bearer, códigos de erro, pasta raiz por ancestrais, proxy com MIME do banco/nosniff/Range/413/502, miniatura só imagem) · `npm run test:rls` **58/58** (novo `drive.test.ts`: verificação auditada e revertida ao trocar o id; capa na publicação e na projeção; `public_file_info` exige cada condição; função só do service role) · build 84 páginas · `npm run test:e2e` **262/262** (novo em `security-headers`: mídia 404 sem redirect, rotas de bytes do Portal 307 para login, `driveConfigured` no health). Migration 8 aplicada na nuvem.

Sem credencial real do Drive não há teste ponta a ponta com bytes verdadeiros — o cliente é coberto por `fetch` simulado; o primeiro arquivo real deve ser verificado manualmente pela página do arquivo após configurar a conta de serviço.

## Decisões

1. Conta de serviço (não OAuth de usuário): o Portal lê uma pasta institucional compartilhada com a conta; ninguém autoriza o próprio Drive. Só leitura.
2. Bytes sempre por proxy, nunca por link do Drive (17/21): a autorização continua no RLS/`public_file_info`; despublicar/revogar surte efeito em minutos (cache curto) sem depender de permissões no Google.
3. Capa pública exige `classification = public` além de consentimento: o consentimento diz que pode aparecer, a classificação diz que é público — os dois são decisões distintas da coordenação.
4. Sem redimensionamento próprio: miniaturas usam as geradas pelo Drive (Portal); no site vai o original (limitado por allowlist a 20 MB de imagem) — otimização de imagem fica para quando houver CDN/decisão de hospedagem.

## Depende do usuário

Projeto Google Cloud com Drive API ativa; conta de serviço (`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_KEY` em PEM ou base64); pasta institucional compartilhada com essa conta como Leitor e, se quiser restringir, seu id em `GOOGLE_DRIVE_ROOT_FOLDER_ID`.
