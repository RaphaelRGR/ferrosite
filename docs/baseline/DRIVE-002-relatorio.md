# DRIVE-002 — Google Drive institucional por OAuth 2.0

Data: 2026-09-21 · Pedido direto do usuário (fundação da integração); complementa DRIVE-001 (conta de serviço). Guia de uso: `docs/GOOGLE_DRIVE_INTEGRATION.md`. Docs 11, 17, 21.

## Entregue

| Área | Implementação |
|---|---|
| Separação de identidades | Supabase Auth continua sendo a única identidade do Portal. Google OAuth só autoriza o Drive: `start`/`callback` exigem sessão Supabase **ativa** de admin/coordenação (`requireDriveManager`), o callback confere que é o **mesmo usuário** que iniciou (`userId` no cookie assinado) e nunca cria sessão. |
| OAuth no servidor | `google-oauth.ts`: `state` + PKCE S256 em cookie httpOnly assinado por HMAC (10 min, `path=/api/auth/google`, `Secure` em https); troca do `code` e refresh com `client_secret` só no servidor; `access_type=offline` + `prompt=consent` para obter refresh token; revogação em `oauth2/revoke`. Erros do Google mapeados (`access_denied`, `redirect_uri_mismatch`, `invalid_client`, `invalid_grant`, sem refresh token, rede). |
| Tokens | AES-256-GCM (`DRIVE_TOKEN_KEY`, fallback derivado da service role) antes de ir à tabela `drive_integration` (migration 9), que **não tem policy** para `authenticated`/`anon`; UI só recebe `drive_integration_status()` (sem tokens; `has_refresh_token` booleano). Nada em localStorage/cookie legível/resposta de API. |
| Refresh | `oauthTokenSource`: usa o access token enquanto faltam > 60 s; senão renova pelo refresh token e persiste cifrado; `invalid_grant` ⇒ `status = revoked` e a UI pede reconexão. |
| Cliente Drive | `drive.ts` refatorado para origem de token injetável (`TokenSource`): OAuth ou conta de serviço (JWT) — o proxy de bytes, a verificação de arquivos e a capa pública (DRIVE-001) passam a funcionar com qualquer uma. Novos `about()` e `listFolder()`; `parseDriveId` aceita `/folders/<id>`; erros da API classificados (`api_disabled`, `revoked`, `forbidden`, `not_found`, `network`). |
| UI | Configurações → **Integrações** → Google Drive: Não conectado / Conectado (conta, pasta raiz, escopo, última verificação) / Autorização revogada; **Testar conexão** (token, conta, pasta, até 20 itens, hora), **Salvar pasta** (id ou link, valida que é pasta), **Desconectar** (revoga no Google e zera tokens; nada apagado no Drive). Modo claro/escuro e 375 px sem overflow (o cabeçalho do Portal foi ajustado: nome oculto em telas estreitas). |
| Permissões | Página: membros veem aviso; rotas `/api/auth/google/*` e ações respondem 403 a quem não é admin/coordenação; a função do banco devolve vazio. Auditoria: `drive.connected`, `drive.test`, `drive.folder_set`, `drive.disconnected`. |
| Config | `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI`, `GOOGLE_DRIVE_ROOT_FOLDER_ID` (semente), `DRIVE_TOKEN_KEY`; `npm run google:env` copia do JSON em `secrets/`; `.gitignore` cobre `/secrets/`, `client_secret*.json`, `google-oauth*.json`. |

## Escopo

`drive.readonly`. `drive.file` avaliado e descartado nesta fase: não dá acesso a uma pasta pré-existente (só a itens criados pelo app ou escolhidos num Picker); `drive.metadata.readonly` não permite baixar bytes. Implicação: escopo restrito ⇒ app em Teste com usuários de teste até verificação do Google. Mitigação: conta institucional dedicada + confinamento à pasta raiz + nenhum escopo de escrita.

## Validação

`npm run lint` 0/0 · `npm run typecheck` ok · `npm test` **170/170** (novo `google-oauth.test.ts`: variáveis e nomes do que falta; state assinado/expirado/adulterado/outra chave; URL com escopo, offline+consent, S256, sem secret; troca com verifier e exigência de refresh token; mapeamento de erros; refresh e `invalid_grant`; cifra ida-e-volta/adulteração; origem de token: usa válido sem tocar no Google, renova expirado e persiste cifrado, revogação marca `revoked`, desconectar revoga e zera) · `npm run test:rls` **61/61** (novo `drive-integration.test.ts`: linha única, ninguém autenticado lê/escreve, função sem tokens só para admin/coordenação) · build 84 páginas + 3 rotas · e2e `drive-integration.spec.ts` **3/3** contra a nuvem (TESTE 1 anônimo → login; TESTE 2 membro → aviso + 403 nas rotas; TESTE 3 não conectado; TESTE 4 redirect ao Google com PKCE/state/cookie httpOnly quando configurado; TESTE 5 callback com state forjado recusado; TESTE 9 estado inicial; TESTE 10 escuro; TESTE 11 mobile sem overflow). Suíte completa `npm run test:e2e` **266/266** (o fail-fast do passo do desafio na jornada passou a ignorar o `role="alert"` vazio do anunciador de rotas do Next).

**Não executado automaticamente** (exige consentimento humano com a conta de teste no Google): TESTE 5 com `code` real, TESTE 6/7 (testar conexão e listar pasta reais) e TESTE 8 com token real expirado — cobertos por testes unitários com o Google simulado; o roteiro manual está no guia.

## Decisões

1. Conexão **institucional única** (uma linha), não por usuário: o Drive é do curso; quem conecta é a coordenação com a conta institucional.
2. Sem SDK do Google (três endpoints REST) e sem Picker nesta fase: pasta raiz por id/link, com validação no Drive; a seleção visual fica para depois sem mudar o modelo.
3. Cabeçalho do Portal ajustado (nome oculto < 640 px, pílulas do tema mais estreitas): era um overflow pré-existente em todas as páginas do Portal a 375 px, detectado pelo TESTE 11.
4. O assistente não gravou o client secret (política de credenciais): `npm run google:env` faz isso localmente.

## Depende do usuário

`npm run google:env` → reiniciar `npm run dev` → Google Auth Platform: conta de teste adicionada; Drive API ativada → abrir `http://localhost:3000/portal/configuracoes/integracoes` → Conectar → Testar → Salvar pasta → Desconectar → Reconectar.
