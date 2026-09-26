# DESIGN-C: identidade dos projetos, foto no hero do Curso, vídeo e ritmo da Home (Bloco C da auditoria, 2026-09-26)

## Problema (auditoria de design, 2026-09-25)

- Os 9 projetos eram cartões de texto idênticos; o selo de categoria tinha um círculo que parecia botão de rádio.
- O hero do Curso usava uma ilustração genérica, embora já houvesse fotos reais publicadas.
- A seção de vídeo ficava desequilibrada no desktop (coluna de texto curta, vazio lateral grande).
- Na Home, seções vizinhas repetiam o mesmo fundo (hero e experiências; frentes e projetos).

## Entregue

| Área | Implementação |
|---|---|
| Tokens | `--cat-{communication,competition,extension,rd,research,other}-{bg,fg}` em `globals.css`, tema claro e escuro; os 12 pares entram em `tests/unit/tokens-contrast.test.ts` (texto normal, ≥ 4,5:1). |
| Projetos | `src/components/public/ProjectCover.tsx`: `CategoryChip` (cor + ícone + texto; o status não depende só da cor) e `ProjectCover` (fundo da cor da categoria, trilhos discretos e ícone grande; decorativa). Ícones: megafone (comunicação), troféu (competição), capelo (extensão), engrenagem (P&D com empresas), frasco (pesquisa), pessoas (outros). Foto autorizada sempre tem prioridade; a capa ilustrada entra só enquanto não houver foto. Aplicado nos cartões (Home e hub) e no detalhe do projeto. |
| Curso | Nova chave `site_image.course_hero` (editável em Configurações → Imagens do site, como a capa da Home), definida pela coordenação com a foto da turma na RUMO. `CourseHero` mostra a foto pelo proxy (`srcset` responsivo, alt e crédito) e volta para a ilustração se a foto deixar de ser liberada. A página do Curso revalida a cada 5 min, como a Home. |
| Vídeo | Contêiner mais estreito (`max-w-5xl`, colunas `1fr / 320px`): texto e vídeo formam um bloco só. |
| Ritmo da Home | Fundos alternados em produção: hero (superfície) → experiências (fundo) → vídeo (superfície) → frentes (fundo) → projetos (superfície) → CTA (fundo). Cartões sempre com o tom oposto ao da seção. |

## Testes

- `tests/e2e/design-c.spec.ts` (novo): todo cartão de projeto tem foto **ou** capa ilustrada; selo com ícone e texto; capa com cor de categoria (não transparente); hero do Curso com foto pelo proxy, alt e crédito; na Home, seções consecutivas (como saem em produção) não repetem o fundo.
- `tokens-contrast.test.ts`: 12 pares novos em dois temas.
- Validação: lint 0/0 · typecheck · unit 196 · build · e2e 308 verdes + 1 caso ambiental (limite de 5 envios de desafio por hora, após várias rodadas seguidas).

## Observação

O servidor de desenvolvimento (`next dev`) manteve em cache o CSS anterior aos tokens mesmo após reinício; o build de produção já trazia os tokens. Se as cores das categorias não aparecerem localmente, apagar `.next/dev` e reiniciar o `next dev`.
