# Portal Ferroviária

## Estado atual e estratégia

O Portal não existe funcionalmente; quatro páginas são TODOs. Construir fundação segura e uma fatia vertical completa antes de multiplicar módulos. O dashboard não é a primeira implementação: depende de dados, permissões e fontes.

## Shell

Sidebar recolhível; header com busca autorizada, contexto, notificações, tema e perfil; um único `<main>`; breadcrumbs; atalhos de teclado documentados. Desktop usa sidebar; tablet pode usar rail/drawer; smartphone usa navegação curta para Minhas missões, Agenda, Projetos, Notificações e ação Registrar.

## Dashboards por perfil

- Aluno/membro: minhas missões, prazos, projetos, agenda, oportunidades e notificações.
- Líder: saúde dos projetos vinculados, bloqueios, equipe, validações, próximos marcos.
- Professor/orientador: entregas a revisar, projetos orientados, reuniões e alertas.
- Coordenação: visão transversal descrita em `12`.
- Admin: saúde operacional, convites, integrações, falhas e configuração; não mostrar dados pessoais sem necessidade.
- Externo: apenas recursos concedidos e contexto mínimo.

Widgets são derivados da mesma fonte dos módulos, declaram janela temporal e possuem estados vazio/erro/stale. Gráfico decorativo é proibido.

## Módulos

- Projetos e módulos configuráveis.
- Missões em lista/Kanban/calendário.
- Pipelines reutilizáveis com transição auditada.
- Registro de atividade separado de missão.
- Pessoas/memberships/permissões.
- Experiências/visitas/missões ferroviárias.
- Parceiros/CRM e desafios P&D.
- Oportunidades/editais.
- Arquivos/Drive/galeria.
- Aprovações/publicação.
- Relatórios/indicadores.
- Calendário/notificações.
- Configurações/auditoria.

## Regras transversais

1. Toda mutação valida input e autorização no servidor.
2. RLS protege dados mesmo se a rota for chamada diretamente.
3. Mutação crítica registra auditoria; atividade de negócio permanece separada.
4. Busca/exportação/relatório respeitam a mesma permissão da tela.
5. Arquivamento é preferido a exclusão; exclusão material exige confirmação e política.
6. Tema e densidade não alteram significado.
7. Estados não dependem só de cor.
8. Operação concorrente não sobrescreve silenciosamente edição recente.

## Primeira fatia vertical

Projeto + membership + missão + comentário/atividade + histórico, com auth/RLS, UI responsiva, temas, testes positivos/negativos e dados de demonstração claramente marcados fora de produção. Essa fatia valida arquitetura antes de CRM/Drive/relatórios.
