# Tema claro e escuro do Portal

## Objetivos

Conforto prolongado, consistência entre páginas, contraste AA e significado estável. O modo escuro não é inversão. Requisito mínimo: Claro/Escuro; “Sistema” é recomendado se não complicar a primeira renderização.

## Persistência e inicialização

- preferência do usuário autenticado no perfil; cache local/cookie para aplicar antes da hidratação;
- prioridade: escolha explícita > sistema > default claro;
- atributo `data-theme` no elemento raiz do Portal;
- script/estratégia server-aware evita flash incorreto;
- navegar, recarregar e reabrir sessão preserva tema;
- alteração sincroniza abas quando viável;
- site público não herda tema escuro do Portal.

## Famílias de tokens

| Função | Claro | Escuro |
|---|---|---|
| canvas | off-white frio | carvão/azul muito escuro, nunca preto absoluto |
| surface 1/2/3 | branco e cinzas graduais | carvões graduais sem perder borda |
| texto | quase preto + cinza | cinza muito claro, evitando branco puro em corpo |
| borda | cinza discreto | cinza-azulado visível |
| ação laranja | institucional, contraste validado | versão ajustada menos agressiva, contraste validado |
| foco | anel de alto contraste + offset | anel claro/laranja com offset escuro |

Valores finais devem ser medidos; não copiar cegamente cores do mockup.

## Componentes críticos

- Sidebar/header: seleção com barra/ícone/rótulo, não só fundo.
- Tabelas: header, hover, seleção, zebra opcional, sticky e divisores testados.
- Inputs: label persistente, placeholder secundário, erro com texto/ícone.
- Modais/dropdowns/tooltips: elevação e backdrop distintos por tema.
- Kanban: coluna e card distinguíveis; status por badge textual.
- Calendário: hoje, selecionado, evento, conflito e fora do mês distintos.
- Gráficos: paleta de 6–8 séries validada nos dois fundos; padrões/markers/labels para cor insuficiente; tooltip tem tokens próprios.
- Timeline/pipeline: linha base visível, etapa atual com texto/ícone.
- Skeleton: baixo contraste sem shimmer obrigatório.
- PDF/logo/imagem transparente: usar “media mat” neutro quando o asset exige fundo claro.

## Casos especiais

- Imagens não são invertidas.
- Logo com versão apenas clara recebe superfície clara aprovada.
- Mapas escolhem estilo por tema, mas preservam rótulos.
- Editores ricos, bibliotecas de gráfico e calendário devem receber tema explicitamente.
- Conteúdo HTML/PDF de terceiros fica em viewer isolado; não aplicar filtros destrutivos.
- Impressão e relatório exportado usam tema próprio de impressão, normalmente claro.

## Critérios de teste

1. escolher cada modo, navegar por todas as rotas e recarregar sem reset;
2. primeira pintura não pisca o tema oposto;
3. axe + medição manual de contraste em ambos;
4. teclado/foco visível em todos os controles;
5. screenshots de cada componente/estado/tema;
6. gráficos, tabela, Kanban, calendário, modal, dropdown, notificações e viewer legíveis;
7. status continuam compreensíveis em escala de cinza;
8. tema troca sem reload, perda de formulário ou refetch desnecessário.
