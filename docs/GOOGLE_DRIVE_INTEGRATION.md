# Integração com o Google Drive (DRIVE-002)

Fundação da conexão institucional do Portal com o Google Drive por OAuth 2.0. **A identidade e o acesso ao Portal continuam no Supabase Auth**; o Google só autoriza o Drive. Ninguém entra no Portal por ter conectado uma conta Google.

## Arquitetura

```
Supabase (fonte de verdade de dados estruturados)      Google Drive (fonte de verdade de documentos)
  profile / project / mission / file_asset …              pasta institucional "Engenharia Ferroviária UFSC"
  drive_integration (linha única, só service role)   ◄──  tokens cifrados (AES-256-GCM) + pasta raiz
                    ▲                                            ▲
                    │ RLS / função drive_integration_status       │ Drive API v3 por fetch (sem SDK), só leitura
              Portal (Next.js) ─────────────────────────────────┘
              /portal/configuracoes/integracoes · /api/auth/google/{start,callback}
              proxy de bytes: /portal/arquivos/[id]/{original,miniatura} · /api/midia/[id]
```

| Camada | Arquivo | Papel |
|---|---|---|
| OAuth | `src/lib/files/google-oauth.ts` | URL de consentimento, `state` + PKCE (cookie httpOnly assinado), troca do `code`, refresh, revogação, cifra dos tokens |
| Conexão | `src/lib/files/drive-connection.ts` | leitura/escrita da linha `drive_integration` (service role), origem de token com refresh automático, `getDriveClient()` (OAuth → conta de serviço → nada) |
| Cliente | `src/lib/files/drive.ts` | Drive API v3: metadados, `about`, listagem de pasta, download/miniatura, pasta raiz por ancestrais |
| Guard | `src/lib/files/drive-guard.ts` | sessão Supabase ativa **e** papel admin/coordenação — usado por rotas e ações |
| Rotas | `src/app/api/auth/google/start`, `…/callback` | início e retorno do OAuth |
| Ações | `src/lib/portal/actions/drive.ts` | testar conexão, salvar pasta, desconectar (auditadas) |
| UI | `src/app/(portal)/portal/configuracoes/integracoes/page.tsx`, `src/components/portal/DriveIntegration.tsx` | Configurações → Integrações → Google Drive |
| Banco | `supabase/migrations/20260921000100_drive_integration.sql` | tabela + função de estado sem tokens |
| Erros | `src/lib/files/drive-errors.ts` | mensagens para a UI (sem stack/segredos) |

Arquivos relacionados a projetos/missões continuam em `file_asset` (`provider = google_drive`, `external_id` = fileId) — a integração só fornece o acesso; a arquitetura "Supabase = metadados, Drive = bytes" do FILE-001/DRIVE-001 permanece.

## Fluxo OAuth

1. Usuário com sessão Supabase (admin/coordenação) abre **Configurações → Integrações** e clica **Conectar Google Drive** (`GET /api/auth/google/start`).
2. O servidor valida sessão e papel, gera `state` + `code_verifier` (PKCE S256), grava-os num cookie httpOnly assinado (10 min, path `/api/auth/google`) e redireciona ao consentimento do Google com `access_type=offline` e `prompt=consent` (garante refresh token).
3. Google devolve `code` + `state` em `GET /api/auth/google/callback`. O servidor confere sessão, papel, cookie (assinatura, validade, mesmo `userId`, mesmo `state`), troca o `code` por tokens (com `client_secret` só no servidor), identifica a conta via `about.get` e grava tudo cifrado em `drive_integration`. Auditoria `drive.connected`.
4. A partir daí `getDriveClient()` usa o access token; quando faltam < 60 s para expirar, renova com o refresh token e persiste. `invalid_grant` no refresh ⇒ estado `revoked` (UI pede reconexão).

## Variáveis

| Variável | Onde | Uso |
|---|---|---|
| `GOOGLE_CLIENT_ID` | servidor | id do cliente OAuth "Aplicativo da Web" (projeto `ferrosite`) |
| `GOOGLE_CLIENT_SECRET` | **servidor, nunca no browser** | troca do `code` e refresh |
| `GOOGLE_REDIRECT_URI` | servidor | dev: `http://localhost:3000/api/auth/google/callback` |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | servidor (opcional) | semente da pasta raiz; a configuração vale a do banco (Integrações → Salvar pasta) |
| `DRIVE_TOKEN_KEY` | servidor (opcional) | chave da cifra dos tokens; sem ela deriva da service role. Mudar invalida a conexão (reconectar) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL/KEY` | servidor (opcional) | alternativa sem OAuth (DRIVE-001); só usada quando não há conexão OAuth |

Preencher em dev: baixe o JSON do cliente em `secrets/client_secret*.json` (ignorado pelo git) e rode:

```bash
npm run google:env
```

O script copia `client_id`, `client_secret` e o redirect para `.env.local` sem imprimir valores; depois disso o código **não lê o JSON**. Reinicie `npm run dev`.

## Escopo

`https://www.googleapis.com/auth/drive.readonly`.

`drive.file` foi avaliado primeiro e **não atende esta fase**: ele só enxerga arquivos criados pelo próprio app ou escolhidos pelo usuário num Google Picker. A pasta institucional já existe e o requisito é apontar para ela por id e listar/ler o conteúdo — com `drive.file` o `files.get` da pasta devolve 404. `drive.metadata.readonly` listaria, mas não permite baixar bytes (proxy do Portal e capa pública).

Implicações do `drive.readonly`: é um escopo *restrito* no Google — em modo **Teste** só usuários de teste autorizam; para publicar o app o Google exige verificação (política de privacidade, justificativa). Mitigações: conectar uma **conta institucional** cujo Drive contém só o material do curso, confinar pelo `root folder` (o Portal recusa itens fora dela) e nunca pedir escrita. Upload (fase futura) pedirá `drive.file` adicional, não `drive`.

## Página de configuração

`/portal/configuracoes/integracoes` (atalho em Configurações). Estados:

- **Não conectado** → botão *Conectar Google Drive* (desabilitado com a lista exata das variáveis que faltam).
- **Conectado** → conta, pasta raiz, escopo, última verificação; *Testar conexão*, *Salvar pasta* (id ou link), *Desconectar*.
- **Autorização revogada** → explicação + *Reconectar* (e *Desconectar* para limpar).

Só admin/coordenação veem o card; membros recebem aviso, e as rotas/ações respondem 403 independentemente da UI (função do banco também nega).

## Como testar

1. `npm run dev` → entre no Portal (Supabase) com uma conta admin/coordenação.
2. Abra **http://localhost:3000/portal/configuracoes/integracoes**.
3. *Conectar Google Drive* → consentimento com a **conta de teste** → volta com "Google Drive conectado".
4. *Testar conexão*: conta, pasta (se configurada), itens encontrados, última verificação.
5. *Salvar pasta* com o link `https://drive.google.com/drive/folders/<id>` → teste de novo → itens listados.
6. *Desconectar* → estado volta a "Não conectado" → *Conectar* de novo.

Automatizados: `tests/unit/google-oauth.test.ts` (state/PKCE/URL/troca/refresh/cifra/revogação), `tests/rls/drive-integration.test.ts` (tabela só service role, função sem tokens), `tests/e2e/drive-integration.spec.ts` (anônimo, membro, admin, início do OAuth, callback inválido, tema escuro, mobile).

> Estado em 2026-09-21: conectado com a conta institucional e pasta raiz **FERROVIÁRIA** (7 subpastas); o roteiro acima foi executado de ponta a ponta, incluindo refresh forçado e desconexão/reconexão (`docs/baseline/DRIVE-002-relatorio.md`). Importante: o consentimento deve ser feito **no mesmo navegador** que clicou em *Conectar* (o `state` fica em cookie desse navegador).

## Localhost

Google Cloud → APIs e serviços → Credenciais → cliente OAuth `ferrosite`:

- Origens JavaScript: `http://localhost:3000`
- URIs de redirecionamento: `http://localhost:3000/api/auth/google/callback`
- Biblioteca: **Google Drive API ativada**
- Google Auth Platform → Público: app **Externo** em **Teste** ⇒ adicione a conta que vai conectar em *Usuários de teste*.

## Produção (futuro)

Sem reescrever nada: defina `GOOGLE_REDIRECT_URI=https://<domínio>/api/auth/google/callback` e adicione o mesmo valor (e a origem `https://<domínio>`) no cliente OAuth. O cookie de `state` passa a `Secure` automaticamente com `https`. Defina `DRIVE_TOKEN_KEY` estável antes da primeira conexão em produção. Para sair do modo Teste, submeter o app à verificação do Google (escopo restrito) ou mantê-lo em Teste com as contas institucionais listadas. `[CONTEÚDO PENDENTE]`: domínio.

## Erros comuns

| Sintoma | Causa | Ação |
|---|---|---|
| Botão desabilitado com lista de variáveis | `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI` ausentes | `npm run google:env` e reiniciar |
| Página do Google: `redirect_uri_mismatch` | redirect não cadastrado no cliente OAuth | adicionar `GOOGLE_REDIRECT_URI` exato no Google Cloud |
| Volta com "Autorização negada… usuários de teste" (`access_denied`) | conta não está nos usuários de teste, ou consentimento cancelado | Auth Platform → Público → Usuários de teste |
| "verificação anti-CSRF falhou" | cookie de `state` expirou (10 min), outro navegador, ou callback forjado | iniciar de novo |
| "Google não devolveu um refresh token" | app já autorizado antes sem `prompt=consent` | remover o acesso em myaccount.google.com/permissions e reconectar |
| "Google Drive API não está ativada" (`accessNotConfigured`) | API desligada no projeto | ativar na Biblioteca |
| "autorização expirou ou foi revogada" (`invalid_grant`) | senha alterada, acesso removido, app em Teste com token > 7 dias | *Reconectar* |
| "não tem permissão / escopo insuficiente" | item fora do alcance da conta ou escopo antigo | conta certa; reconectar para o escopo atual |
| "Item não encontrado" | id errado, apagado, ou conta sem acesso | conferir link/pasta compartilhada com a conta conectada |
| "não é uma pasta" | id de arquivo em *Salvar pasta* | usar link `/folders/<id>` |
| "Não foi possível falar com o Google Drive (rede)" | falha de rede/timeout | tentar de novo; ver `/api/health` |

Nenhuma mensagem mostra stack, token ou segredo; o log do servidor registra só códigos (`drive.oauth.*`) com `userId`.

## Segurança (checagem feita)

- Client secret só em `google-oauth.ts` (servidor); bundle `.next/static` sem `GOOGLE_CLIENT_SECRET`/`SERVICE_ROLE`/`token_enc`.
- Tokens: cifrados no banco, tabela sem policy para `authenticated`/`anon`; nunca em cookie legível, localStorage ou resposta de API; a UI recebe só a função de estado (`has_refresh_token` booleano).
- Rotas e ações validam sessão + papel no servidor; membro recebe 403.
- `secrets/`, `client_secret*.json`, `google-oauth*.json`, `.env*` (exceto `.env.example`) ignorados pelo git.
