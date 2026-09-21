import type { DriveError } from "./drive";
import type { OAuthError } from "./google-oauth";

/** Mensagens para a UI (PT do Portal) — nunca detalhes internos, stack ou segredos. */
export function driveErrorMessage(code: DriveError | OAuthError | string): string {
  switch (code) {
    case "unconfigured": return "Google Drive não conectado (Configurações → Integrações).";
    case "revoked": return "A autorização do Google expirou ou foi revogada. Conecte o Google Drive novamente.";
    case "api_disabled": return "A Google Drive API não está ativada no projeto do Google Cloud (APIs e serviços → Biblioteca → Google Drive API).";
    case "forbidden": return "A conta conectada não tem permissão para este item, ou o escopo autorizado é insuficiente.";
    case "not_found": return "Item não encontrado no Drive (id errado, apagado ou fora do alcance da conta conectada).";
    case "trashed": return "O item está na lixeira do Drive.";
    case "outside_root": return "O item está fora da pasta institucional configurada.";
    case "network": return "Não foi possível falar com o Google Drive (rede). Tente de novo.";
    case "provider": return "O Google Drive respondeu com erro. Tente de novo em instantes.";
    case "access_denied": return "Autorização negada ou cancelada. Se a conta não estiver na lista de usuários de teste do app no Google Cloud (Auth Platform → Público), adicione-a e tente de novo.";
    case "redirect_uri_mismatch": return "O redirect URI configurado no Google Cloud não coincide com GOOGLE_REDIRECT_URI.";
    case "invalid_client": return "Client ID/secret rejeitados pelo Google. Confira GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET.";
    case "invalid_grant": return "Código de autorização inválido ou expirado. Inicie a conexão de novo.";
    case "no_refresh_token": return "O Google não devolveu um refresh token. Remova o acesso do app em myaccount.google.com/permissions e conecte de novo.";
    case "state": return "A verificação anti-CSRF falhou (sessão expirada ou navegador diferente). Inicie a conexão de novo.";
    case "not_folder": return "O id informado não é uma pasta.";
    default: return "Falha ao falar com o Google Drive.";
  }
}
