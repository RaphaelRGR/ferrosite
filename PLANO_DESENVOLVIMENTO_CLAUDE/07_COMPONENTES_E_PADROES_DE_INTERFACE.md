# Componentes e padrões de interface

## Camadas

- `ui`: Button, LinkButton, IconButton, Input, Select, Dialog, Drawer, Tabs, Table, Badge, Tooltip, Toast, Skeleton.
- `patterns`: PageHeader, FilterBar, DataList, EmptyState, PermissionBoundary, ConfirmAction, Timeline, MetricDefinition.
- `features`: componentes que conhecem Projeto, Missão, Pessoa etc.
- `app`: composição de rotas, carregamento e metadados; sem arrays institucionais hard-coded.

## Contratos essenciais

- Botão executa ação; link navega. Não usar `div` clicável.
- Todo IconButton tem nome acessível e alvo mínimo de toque.
- Dialog: título/descrição, `aria-modal`, foco inicial, trap, Escape, retorno de foco e scroll lock.
- Form: label, ajuda, required, erro por campo e resumo, envio idempotente, loading/success.
- Table: caption/headers, ordenação anunciada, paginação server-side, alternativa mobile.
- FilterBar: URL como estado quando compartilhável; “limpar”; número de resultados; sem submit oculto.
- EmptyState informa por que está vazio e oferece ação permitida.
- ConfirmAction descreve alvo e consequência; ação destrutiva usa confirmação reforçada conforme risco.
- Toast não é único canal de erro e nunca contém informação sensível.

## Padrões ferroviários úteis

Timeline/estações para histórico; linha de progresso para marcos; mapa/lista sincronizados; pipeline com etapas. Não usar trilho como background repetitivo.

## Componentes a refatorar no legado

- `Navbar.tsx`: dividir dados, desktop, mobile e comportamento; corrigir teclado/foco.
- `AnimatedSection.tsx`: reduced motion e conteúdo visível sem JS.
- `CurriculumFlowchart.tsx`: controller de grafo separado da renderização.
- `SubjectModal.tsx`: usar Dialog acessível.
- animações GSAP: provider/utilitário único e carregamento sob demanda.

## Estados de domínio

Missão: Planejada, Em execução, Em validação, Concluída, Pausada, Cancelada; “Atrasada” é condição derivada de prazo/status, não necessariamente estado persistido. Projeto e conteúdo usam máquinas de estado próprias e transições validadas.
