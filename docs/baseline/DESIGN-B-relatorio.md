# DESIGN-B: hub de Experiências com fotos, capa padrão e metadados curtos (Bloco B da auditoria, 2026-09-26)

## Problema (auditoria de design, 2026-09-25)

- O hub `/experiencias` era uma linha do tempo só de texto, com linhas de ~150 caracteres e nenhuma foto, enquanto a Home mostrava as mesmas experiências em cartões com foto: a página principal do assunto era a mais pobre.
- Experiência sem foto (visita à FTC) virava um cartão alto e vazio no meio da grade.
- Metadados como "8 DE JUL. DE 2026 · SALA DE CINEMA, BLOCO U, UFSC JOINVILLE" em caixa alta quebravam em duas linhas.
- Depois do Bloco A, o botão "Acompanhe as notícias" do CTA final levava a uma página sem nenhuma notícia publicada.

## Entregue

| Área | Implementação |
|---|---|
| Cartão único | `src/components/public/ExperienceCard.tsx`, usado na Home e no hub: foto (miniatura responsiva) ou capa padrão; linha curta **tipo · data** ("Palestra · 8 de jul. de 2026"); título com link esticado (cartão inteiro clicável); **local em linha própria**, caixa normal, com ícone e corte em uma linha; resumo limitado a três linhas. |
| Tipo | Derivado do título que a coordenação já usa ("Visita técnica: …", "Palestra …"; o resto é evento). Rótulos PT/EN em `experiences.kinds`. |
| Capa padrão | `FallbackCover`: fundo laranja institucional, trilhos em perspectiva, locomotiva e o tipo do evento em branco (5,1:1 de contraste). Decorativa (`aria-hidden`), porque o título já nomeia a experiência. |
| Hub | Filtros por tipo e por ano como **links** (estado na URL, compartilhável, funciona sem JS; valor inválido cai em "todos"); contador; experiências **agrupadas por ano**, mais recentes primeiro; grade de 1/2/3 colunas. O bloco antigo do protótipo continua abaixo apenas em `review` (preview/local). |
| CTA final | "Acompanhe as notícias" só aparece quando existe notícia publicada. |

## Testes

- `tests/e2e/experiences-hub.spec.ts` (novo): anos em ordem decrescente; todo cartão tem foto **ou** capa padrão (nunca bloco vazio); linha "tipo · data"; filtro por tipo e ano na URL mostra só o que corresponde; parâmetro inválido volta ao total; capa padrão é decorativa; CTA de notícias ausente sem notícia publicada.
- `public-hubs.spec.ts` e `media.spec.ts` ajustados (contador escopado ao bloco do protótipo; tempo realista para a foto grande do lightbox, que vem do Drive).
- Validação: lint 0/0 · typecheck · unit 184 · build · e2e 304 verdes + 2 casos ambientais na rodada completa (limite de 5 envios/hora do anti-spam e o lightbox sob carga, que passa isolado e agora tem tempo de carga realista).
