# Design system e direção visual

## Direção

Site: claro, respirado, editorial, fotográfico, institucional e tecnológico. Portal: operacional, denso sem ser apertado, claro/escuro. A família visual se une por tipografia, laranja institucional, raio/espaço e linguagem de trajetória.

## Identidade real

Fonte disponível: `referencias_ferro/LOGOS DE FERROCOMUNICA (1).png`, símbolo laranja/vermelho com trilhos e dois pontos amarelos, wordmark cinza/preto. Não redesenhar. Solicitar arquivo vetorial e versões oficiais antes de produção.

Regras provisórias até manual oficial:

- usar proporção original; nunca esticar, girar, aplicar sombra ou recolorir arbitrariamente;
- respiro mínimo: ao menos a altura de um dos pontos amarelos ao redor;
- largura recomendada do conjunto: 180–240 px no header desktop, 140–180 px mobile; símbolo isolado somente se versão oficial for fornecida;
- em fundo claro usar versão principal; em fundo escuro usar versão oficialmente aprovada ou superfície neutra clara;
- tamanho mínimo deve ser determinado por teste de legibilidade do wordmark, não por um número inventado;
- nunca usar emoji 🚂 como marca final.

## Tokens semânticos

Não espalhar hex em componentes. Estruturar `color.bg.canvas`, `bg.surface`, `text.primary`, `text.muted`, `border.subtle`, `action.primary`, `focus.ring`, `status.*`, `chart.*`. Separar tokens primitivos dos semânticos e do tema.

Escala recomendada: espaçamento base 4 px; container público máximo ~1200–1280 px; leitura 65–75 caracteres; raios pequenos para controles, médios para cards, grandes somente em blocos hero. Confirmar em protótipo e teste.

## Tipografia

Uma família sans institucional e legível para corpo; títulos podem usar a mesma família em peso forte. Evitar caixa alta em parágrafos. Corpo mínimo 16 px público; Portal pode usar 14 px em dados, mantendo controles e legibilidade. Números tabulares em tabelas/métricas.

## Composição

- Alternar editorial, mídia, dados e listas; não compor tudo com cards iguais.
- Fotografia demonstra pessoas, infraestrutura e prática real.
- Linhas/estações servem timelines, progresso e navegação; não textura repetitiva.
- Sombras discretas e funcionais; borda/superfície criam hierarquia.
- Microinterações 120–240 ms; transições maiores 240–400 ms quando explicam mudança.

## Estados

Cada componente especifica default, hover, pressed, focus-visible, selected, disabled, loading, error e success. Status inclui ícone + rótulo + cor. Skeleton preserva geometria e respeita movimento reduzido.

## Governança

Primitivos em `components/ui`; composições de domínio em `features/*`; Storybook ou catálogo equivalente; testes visuais nos dois temas e viewports. Novo hex ou espaçamento fora dos tokens requer justificativa.
