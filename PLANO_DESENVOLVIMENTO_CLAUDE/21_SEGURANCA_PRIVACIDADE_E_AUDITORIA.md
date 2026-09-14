# Segurança, privacidade e auditoria

## Threat model resumido

Atacantes: anônimo, usuário autenticado curioso, membro de outro projeto, externo cujo grant expirou, conta comprometida, integração revogada. Alvos: dados de alunos, contatos, P&D, arquivos, financeiro, relatórios e ações administrativas.

## P0 antes de dados reais

1. Login/callback/logout reais; redirect allowlist; erros seguros.
2. Produção falha fechada se configuração obrigatória faltar.
3. Gate no shell/servidor e RLS em toda tabela privada.
4. Papéis globais + membership por projeto + classificação.
5. Migrations e políticas versionadas; testes de isolamento no CI.
6. Chave privilegiada nunca no cliente.
7. Atualizar `next@16.2.4` e transitivas: o audit de 2026-09-14 reportou 1 crítica/3 altas/1 moderada em produção e sugeriu `next@16.3.5`; reexecutar audit, build e regressão após atualização.

## Classificação

- PUBLIC: aprovado para site.
- INTERNAL: comunidade autorizada.
- RESTRICTED: projeto, P&D, contato ou documento com grant.
- ADMINISTRATIVE: permissões, financeiro, logs e configurações.

Default é INTERNAL ou RESTRICTED conforme domínio, nunca PUBLIC.

## Controles

- validação de entrada/saída, CSRF conforme mecanismo, rate limit e anti-spam;
- upload com limite/MIME/magic bytes/malware scan/nome seguro;
- sessão com cookies seguros, rotação, expiração e revogação;
- proteção contra IDOR por policy, não por ID imprevisível apenas;
- exportação, busca e relatório com mesma policy;
- logs sem token/senha/conteúdo sensível; correlação e alerta;
- ações destrutivas idempotentes, confirmadas e auditadas;
- headers/CSP definidos após inventário de embeds/fontes/imagens.

## Privacidade

Minimização, finalidade, base legal sob orientação institucional, retenção, correção/exclusão quando aplicável, consentimento de imagem e fluxo para titulares. Telefone/email não público por padrão. Documentos de viagem e avaliações têm acesso/retensão restritos.

## Audit event

Ator, ação, alvo/tipo, instante, request/correlation ID, origem, resultado e diff permitido. Append-only; usuário comum não altera. Não armazenar segredo ou payload integral indiscriminadamente. Monitorar mudança de papel, publicação, exportação, download sensível, deleção e configuração.

## Testes negativos

Anônimo em cada rota/API; membro A acessando B; externo após expiração; usuário desativado com sessão ativa; alteração de ID; exportação indevida; arquivo Drive revogado; callback inválido/open redirect; upload malicioso/grande; corrida de aprovação; último admin removido.
