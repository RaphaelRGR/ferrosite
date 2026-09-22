# PRIV-001: aviso de privacidade (2026-09-22)

## Problema

As specs 21 (segurança/privacidade) e 35 (conteúdos pendentes) pedem política de privacidade, cookies e consentimento de imagem. O site não tinha nenhuma página sobre o assunto, embora já publique **fotos de pessoas identificáveis**, receba **dados de contato de empresas** pelo formulário de desafios e opere **contas do Portal**.

## Entregue

| Área | Implementação |
|---|---|
| Página | `/pt/privacidade` (`src/app/(public)/[locale]/privacidade/page.tsx`): dez seções curtas — quem só navega, cookies, vídeos do YouTube, fotos de pessoas, desafios de empresas, contas do Portal, onde os dados ficam, direitos do titular, retenção, responsável e contato. Data da última revisão em `<time>` legível por máquina. |
| Só o que é verdade | Cada afirmação descreve o que o código faz: sem analytics nem rastreadores; cookies apenas de tema, sessão do Portal e estado do OAuth do Drive; YouTube por fachada (player só após o clique, domínio sem cookies); foto no site apenas com classificação pública e consentimento registrado; desafio usado só na triagem e nunca publicado; auditoria com autor e data; banco no Supabase (São Paulo), arquivos no Drive institucional, hospedagem na Vercel. |
| O que falta é dito | Responsável/encarregado, canal de atendimento ao titular, prazos de retenção e a lista oficial de operadores ficam como `[CONTEÚDO PENDENTE]`, num aviso destacado no topo, com a menção à LGPD (Lei 13.709/2018). Nenhuma promessa jurídica não aprovada. |
| Alcance | Link "Privacidade" no rodapé de todas as páginas públicas, link "Como tratamos esses dados" no formulário de desafio (antes do envio) e a rota no `sitemap.xml` e no inventário de rotas dos testes. |
| EN | A página segue a regra do site: sem tradução revisada, `/en/privacidade` mostra a página de pendência em vez de cair no PT. Os textos EN já estão no catálogo para quando a revisão acontecer. |

## Testes

`tests/e2e/privacy.spec.ts` (novo): os nove títulos obrigatórios aparecem; o aviso de pendência contém `[CONTEÚDO PENDENTE]`; o link externo do Google tem `rel="noopener"`; a data é legível por máquina; o rodapé leva à página em três rotas diferentes; PT e EN entram no sitemap; o formulário de desafio aponta para a política; `/en/privacidade` não exibe o texto PT. A rota entrou em `tests/helpers/routes.ts`, então passa a ser coberta por smoke, crawler de links e **axe estrito** nas duas línguas.

Validação: lint 0/0 · typecheck · unit 182 · build · e2e (axe 39, smoke, links, i18n, privacidade e og verdes).

## Fica para depois (decisão da coordenação)

- Nome do encarregado de dados e canal oficial de atendimento ao titular (hoje `[CONTEÚDO PENDENTE]`): sem isso, o pedido de remoção de foto não tem endereço publicado.
- Prazos de retenção de desafios, mensagens, auditoria e acervo.
- Revisão da tradução EN por pessoa competente.
