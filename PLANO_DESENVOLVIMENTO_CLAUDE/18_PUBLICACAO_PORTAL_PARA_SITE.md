# Publicação do Portal para o site

## Arquitetura

O site lê uma projeção pública separada e sanitizada. Nunca consulta tabelas internas com filtro de UI. Conteúdo: rascunho → revisão → alterações solicitadas/revisado → aprovado → agendado/publicado → despublicado/arquivado.

## Registro

Autor, revisores, aprovador, revisão de origem, comentário, timestamps, locale, fonte, consentimento, classificação e snapshot publicado. Alterar dado interno não muda retroativamente publicação sem nova revisão.

## Tipos

Projeto, atualização, notícia, evento, experiência, foto/álbum, pessoa, parceiro, laboratório, oportunidade, indicador e caso P&D autorizado.

## Regras

- PT e EN têm completude/status próprios; não misturar idiomas.
- Preview usa token curto e não indexável.
- Agendamento considera timezone e falha visível/reexecutável.
- Despublicação urgente preserva auditoria e invalida cache.
- Dado pessoal/confidencial nunca é copiado automaticamente.
- Markdown/rich text é sanitizado e links/embeds têm allowlist.

## Aceite

Rascunho não é público; aprovação exige permissão; snapshot é rastreável; rollback restaura versão; cache é invalidado; preview não aparece em busca; publicação incompleta em locale não vaza fallback indevido.
