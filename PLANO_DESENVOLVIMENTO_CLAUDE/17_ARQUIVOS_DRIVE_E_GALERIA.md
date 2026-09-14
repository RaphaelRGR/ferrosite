# Arquivos, Drive e galeria

## Princípio

Drive armazena bytes/acervo; Portal mantém metadados, relações, classificação, consentimento e workflow. Não reduzir a UI a “abrir pasta”. Integração ainda não existe no repositório.

## Modelo

`file_asset`: provider, external_id, nome, MIME, tamanho, hash quando disponível, proprietário, classificação, status, autor, datas e versão. Vínculos explícitos (`project_file`, `mission_file`, `experience_file` etc.) evitam polimorfismo sem integridade.

## Segurança

Segredos/tokens só no servidor e cifrados; escopos mínimos; links privados curtos; validar revogação no provedor; malware scan; allowlist de tipos/tamanho; nomes normalizados; logs sem conteúdo/tokens. A permissão efetiva deve passar pelo Portal e pelo provedor.

## Galeria em escala

Álbuns, capa, filtros, cursor pagination, thumbnails responsivos, lazy loading, blur placeholder, metadados de crédito/alt/consentimento, seleção em lote e fila de processamento. Nunca carregar centenas de originais. Remoção pública não apaga o original sem política.

## Ações

Abrir, vincular, tornar documento oficial, propor publicação, usar como capa, adicionar a galeria e arquivar. “Marcar público” cria solicitação de aprovação; não muda visibilidade diretamente para usuários comuns.
