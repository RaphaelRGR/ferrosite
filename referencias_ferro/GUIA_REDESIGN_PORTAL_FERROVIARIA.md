# GUIA MESTRE — REDESIGN DO SITE E PORTAL DA ENGENHARIA FERROVIÁRIA E METROVIÁRIA — UFSC JOINVILLE

> Documento de direção de produto, experiência e conteúdo para Codex / Claude.
> 
> **Objetivo:** aproximar o projeto atual da visão final do ecossistema digital da Engenharia Ferroviária e Metroviária da UFSC Joinville, usando os materiais visuais disponíveis na pasta `referencias_ferro` como fonte principal de referência visual.

---

## 0. REGRA PRINCIPAL PARA QUEM FOR ALTERAR O PROJETO

Antes de editar qualquer tela, **varrer toda a pasta `referencias_ferro`** e montar mentalmente um inventário do que existe ali:

- logo oficial do curso;
- screenshots do site atual;
- telas conceituais já aprovadas;
- telas claras do site público;
- telas conceituais do Portal;
- imagens de projetos;
- referências de laboratórios;
- imagens de trens, visitas, alunos e experiências;
- PDFs e materiais institucionais;
- este arquivo `.md`.

As imagens da pasta devem ser tratadas como **referência visual e de direção**, não como peças que precisam ser copiadas literalmente. O objetivo é reproduzir a linguagem, hierarquia, leveza, organização e experiência mostradas nelas.

### Não fazer

- Não manter o visual predominantemente escuro do site antigo.
- Não transformar todas as áreas em cards iguais.
- Não criar uma interface genérica de dashboard empresarial sem identidade ferroviária.
- Não exagerar em gradientes, sombras, glassmorphism ou efeitos decorativos.
- Não encher as páginas com texto longo sem hierarquia.
- Não usar trilhos como decoração em excesso.
- Não inventar números institucionais como se fossem oficiais.
- Não inventar empresas parceiras, projetos, laboratórios ou conquistas como fatos confirmados.
- Não tratar o Portal apenas como “área logada com arquivos”.
- Não escolher tecnologia, arquitetura técnica ou infraestrutura neste documento. Este guia define **o que o produto precisa ser**.

---

# 1. VISÃO DO PRODUTO

A plataforma deve ser entendida como **a camada digital da Engenharia Ferroviária e Metroviária da UFSC Joinville**.

Ela possui dois grandes ambientes conectados:

1. **Site Público** — comunicação, atração, divulgação, memória e relacionamento com alunos, comunidade e empresas.
2. **Portal Ferroviária** — gestão de projetos, pessoas, missões, oportunidades, parceiros, documentos, viagens, dados e relatórios.

O site público conta a história.

O Portal registra o que está acontecendo.

Quando fizer sentido, dados aprovados no Portal devem alimentar o site público.

### Conceito central

> **O Portal produz os dados. O site conta a história desses dados.**

---

# 2. IDENTIDADE VISUAL DESEJADA

## 2.1 Direção geral

O novo sistema deve parecer:

- claro;
- limpo;
- institucional;
- contemporâneo;
- tecnológico;
- humano;
- ferroviário sem ser caricato;
- amigável para alunos;
- confiável para empresas;
- visualmente compatível com UFSC e engenharia.

A referência principal são as telas claras presentes em `referencias_ferro`.

## 2.2 Paleta e uso visual

Usar como base:

- branco;
- off-white / creme muito claro;
- cinzas neutros;
- preto / azul muito escuro para textos;
- laranja/vermelho institucional como cor de ação e destaque.

O laranja deve aparecer em:

- CTAs;
- estados ativos;
- ícones importantes;
- pequenas linhas de destaque;
- badges;
- indicadores selecionados.

Evitar grandes massas laranja sem necessidade.

## 2.3 Logo

Usar a logo oficial do curso presente em `referencias_ferro`.

Não redesenhar a marca sem pedido explícito.

Ela deve aparecer de forma limpa no header e footer, com respiro suficiente.

## 2.4 Tipografia e hierarquia

O site deve utilizar títulos grandes e editoriais, mas sem exagero.

Exemplo de ritmo:

- eyebrow / contexto curto;
- título grande;
- subtítulo de 1–3 linhas;
- CTA principal;
- CTA secundário;
- conteúdo visual.

Evitar blocos muito densos de texto.

## 2.5 Uso de trilhos como linguagem visual

Trilhos podem inspirar:

- timelines;
- progresso de projeto;
- separadores;
- milestones;
- conexões em mapas;
- linhas de navegação.

Nunca usar trilhos como textura repetida em todo lugar.

---

# 3. INTERATIVIDADE E MOVIMENTO

O novo design deve parecer vivo, mas não “cheio de animações”.

## 3.1 Princípios

- animações curtas;
- transições suaves;
- foco em feedback de interação;
- nada que atrapalhe leitura;
- nada excessivamente cinematográfico;
- movimento deve ajudar a entender a interface.

## 3.2 Exemplos desejados

- contadores subindo ao entrar na viewport;
- cards com hover discreto;
- imagens reveladas suavemente;
- progresso de projetos animado;
- mapa com pontos ativos;
- timeline de visitas com transição;
- filtros com resposta instantânea;
- microinterações ao concluir missão;
- pequenas transições de status;
- skeleton/loading bem desenhado quando necessário.

## 3.3 Respeitar acessibilidade

Animação não pode ser requisito para entender conteúdo.

Fornecer comportamento reduzido quando o usuário preferir menos movimento.

---

# 4. SITE BILÍNGUE — PORTUGUÊS / INGLÊS

Todo o site público e as principais áreas do Portal devem ter **PT / EN**.

No header:

`PT | EN`

Requisitos:

- manter o usuário na mesma página ao trocar idioma;
- manter filtros e contexto;
- traduzir menus, botões, títulos e conteúdo institucional;
- páginas de projetos podem aceitar conteúdo específico por idioma;
- URLs / rotas e SEO devem considerar a versão de idioma;
- nunca misturar português e inglês na mesma versão.

---

# 5. ARQUITETURA DO SITE PÚBLICO

Menu público recomendado:

- Início
- O Curso
- Projetos
- Experiências
- Notícias
- Comunidade
- Para Empresas
- Portal
- PT / EN

Evitar menu longo com páginas pouco importantes.

---

# 6. HOME — NOVA ESTRUTURA

A Home deve funcionar como uma síntese visual do curso.

## 6.1 Hero

Conteúdo esperado:

- logo / identidade do curso;
- headline forte;
- subtítulo curto;
- CTA “Conheça o curso”;
- CTA “Explorar projetos”;
- foto ferroviária / metroviária de alto impacto;
- referência a UFSC Joinville.

Direção de mensagem:

> Engenharia Ferroviária & Metroviária
> 
> Formação, tecnologia e conexão com o setor para mover cidades, pessoas e o Brasil.

## 6.2 Indicadores

Bloco curto e horizontal com números verificáveis.

Exemplos de categorias:

- visitas realizadas;
- projetos ativos;
- empresas conectadas;
- alunos impactados;
- experiências internacionais.

Se um número não estiver confirmado, usar placeholder administrável e não publicar como fato.

## 6.3 O curso em frentes

Apresentar quatro grandes eixos, por exemplo:

- Infraestrutura;
- Material Rodante;
- Sinalização e Controle;
- Operação e Logística.

Cada eixo deve ter imagem + descrição curta + link.

## 6.4 Projetos em destaque

Mostrar projetos reais com visual forte.

Exemplos já discutidos:

- Comunica Ferro;
- Cavalos de Ferro;
- FerroCards;
- Ferrovia nas Escolas;
- Simulador Ferroviário;
- Missões Ferroviárias;
- VIGIA;
- outros projetos cadastrados.

O bloco deve mostrar no máximo 4–6 destaques e levar para o hub completo.

## 6.5 Experiências

Mostrar visitas, missões e viagens em mapa ou timeline.

Separar:

- Brasil;
- Internacional.

## 6.6 Notícias / atualizações

Bloco com notícias recentes, projetos atualizados e próximos eventos.

## 6.7 Parceiros

Faixa limpa, clara e institucional.

Evitar transformar logos em protagonista da página.

## 6.8 CTA final

Conectar futuro aluno, comunidade e Portal.

---

# 7. PÁGINA “O CURSO”

Objetivo: explicar de forma clara o que é a formação e por que ela é relevante.

## Estrutura

1. Hero com alunos + sistema ferroviário.
2. Sobre o curso.
3. Dados básicos da graduação.
4. 4 pilares da formação.
5. Jornada / trajetória curricular.
6. Laboratórios e ambientes de aprendizagem.
7. Áreas de atuação.
8. Vida universitária.
9. Carreira e mercado.
10. CTA para futuros estudantes.

## Grade curricular

Não repetir a grade antiga em uma muralha de cards.

Criar uma experiência explorável:

- visão geral;
- por fase;
- por área de conhecimento;
- relação entre disciplinas;
- pré-requisitos de forma visual;
- destaque para disciplinas específicas ferroviárias.

---

# 8. HUB PÚBLICO DE PROJETOS

Esta página deve ser muito diferente da Home.

## 8.1 Objetivo

Transformar os projetos em portfólio vivo do curso.

## 8.2 Filtros

Permitir filtrar por:

- Todos;
- Pesquisa;
- Extensão;
- Competição;
- Comunicação;
- Educação;
- Outros.

E por status:

- planejamento;
- em andamento;
- concluído;
- arquivado.

## 8.3 Cards de projetos

Cada card deve mostrar:

- capa;
- nome;
- categoria;
- descrição curta;
- status;
- última atualização;
- equipe ou número de membros;
- indicador principal, quando houver.

## 8.4 Projeto individual público

Cada projeto deve possuir:

- capa;
- descrição;
- problema;
- solução;
- objetivos;
- equipe;
- parceiros;
- cronograma / linha do tempo;
- status atual;
- últimas atualizações;
- resultados;
- galeria;
- documentos públicos;
- notícias relacionadas;
- CTA para contato, quando apropriado.

### Importante

Projeto público deve mostrar apenas informações autorizadas para publicação.

---

# 9. EXPERIÊNCIAS — VISITAS, MISSÕES E VIAGENS

Unificar o conceito de “Visitas” em algo mais amplo.

Nome público recomendado: **Experiências**.

## Incluir

- visitas técnicas;
- missões ferroviárias;
- viagens nacionais;
- viagens internacionais;
- competições;
- congressos;
- eventos acadêmicos relevantes.

## Layout

- mapa interativo;
- filtros Brasil / Internacional;
- indicadores;
- linha do tempo histórica;
- cards com fotos;
- próximas experiências;
- empresas/instituições visitadas;
- depoimentos.

## Página individual de experiência

Mostrar:

- destino;
- instituição;
- data;
- objetivo;
- participantes;
- fotos;
- roteiro;
- aprendizados;
- resultados;
- parceiros;
- conteúdos relacionados.

---

# 10. NOTÍCIAS E COMUNIDADE

## Notícias

Organizar por categorias:

- Pesquisa;
- Infraestrutura;
- Tecnologia;
- Estudantes;
- Eventos;
- Parcerias;
- Sustentabilidade;
- Projetos.

## Comunidade

Criar espaço para:

- professores;
- pesquisadores;
- alunos;
- egressos;
- histórias;
- depoimentos;
- conquistas.

Não precisa funcionar como rede social.

É uma vitrine humana do curso.

---

# 11. PÁGINA “PARA EMPRESAS” — REFAZER COM FOCO EM P&D

Esta página não deve parecer apenas institucional.

Ela deve responder:

> **“Que problema técnico a UFSC Joinville pode me ajudar a resolver?”**

## 11.1 Hero

Mensagem direta:

> Pesquisa, desenvolvimento e soluções para o futuro da mobilidade sobre trilhos.

CTAs:

- Falar com a equipe;
- Explorar capacidades;
- Ver laboratórios;
- Enviar um desafio técnico.

## 11.2 “Qual problema sua empresa quer resolver?”

Criar blocos clicáveis por desafio:

- Material Rodante;
- Via Permanente;
- Sinalização e Controle;
- Operação;
- Logística;
- Manutenção;
- Ruído e Vibrações;
- Materiais;
- Soldagem;
- Automação;
- Simulação;
- Aerodinâmica;
- Geotecnia;
- Dados e IA.

Ao selecionar uma área, mostrar laboratórios e capacidades relacionados.

## 11.3 Laboratórios — NÃO usar apenas lista de cards genéricos

Cada laboratório deve ser apresentado como **capacidade de solução**.

Informações por laboratório:

- sigla;
- nome;
- foto real;
- coordenador;
- linhas principais;
- equipamentos relevantes;
- ensaios possíveis;
- aplicações ferroviárias;
- histórico / projeto relevante;
- contato;
- CTA “Falar sobre esta capacidade”.

### Laboratórios presentes no portfólio fornecido

- LMSE — Mecânica dos Sólidos Experimental;
- LMS — Mecânica dos Solos;
- LabDSE — Desenvolvimento de Sistemas de Engenharia;
- Laboratório de Robótica Avançada;
- NSO — Núcleo de Simulação e Otimização;
- LaCMa — Caracterização de Materiais;
- LIFE — Interações Fluido-Estrutura;
- Aeolus — Aerodinâmica;
- LTS — Tecnologia da Soldagem;
- LAV — Acústica e Vibrações;
- LDTPav — Desenvolvimento e Tecnologia em Pavimentação;
- e demais laboratórios mapeados nos materiais institucionais.

## 11.4 Exemplos de capacidades a destacar

A interface deve deixar visível que o ecossistema pode atender problemas como:

- fadiga de trilhos, rodas, eixos e componentes de bogies;
- integridade estrutural;
- caracterização mecânica de materiais;
- geotecnia de subleito, lastro e sublastro;
- cargas cíclicas e estabilidade de plataforma ferroviária;
- MBSE e engenharia de sistemas;
- integração hardware/software;
- metrologia e geodésia industrial;
- sensores e sistemas embarcados;
- robótica e inspeção;
- simulação estrutural e MEF;
- HPC, IA e otimização;
- realidade virtual aplicada a treinamento;
- caracterização físico-química e microestrutural;
- qualificação de materiais e revestimentos;
- análise de vibração e dinâmica de bogies;
- controle de ruído roda-trilho;
- ensaios em túnel de vento;
- aerodinâmica de material rodante;
- efeito pistão em túneis;
- soldagem e revestimentos contra desgaste;
- procedimentos customizados de soldagem;
- monitoramento acústico e vibratório;
- infraestrutura e materiais aplicáveis à via permanente.

## 11.5 Fluxo de entrada de P&D

Adicionar CTA claro:

> **Tenho um desafio técnico**

Formulário sugerido:

- empresa;
- nome do contato;
- e-mail;
- área;
- resumo do problema;
- contexto;
- prazo desejado;
- anexos;
- nível de confidencialidade;
- interesse em reunião.

Esse envio deve alimentar o Portal como uma oportunidade/desafio de P&D.

---

# 12. PORTAL FERROVIÁRIA — VISÃO GERAL

O Portal não é uma simples área restrita.

É a ferramenta de gestão do ecossistema do curso.

## Navegação principal recomendada

- Dashboard
- Projetos
- Missões
- Pipeline
- Visitas / Experiências
- Parceiros
- P&D / Desafios
- Oportunidades
- Pessoas
- Arquivos
- Aprovações
- Relatórios
- Configurações

O menu pode variar conforme o perfil.

---

# 13. PAPÉIS E PERMISSÕES

Perfis sugeridos:

## Administrador

Pode:

- configurar todo o Portal;
- cadastrar pessoas;
- editar papéis;
- definir permissões;
- ver todos os projetos;
- gerir integrações;
- gerir categorias e modelos;
- acessar logs;
- administrar publicação no site.

## Coordenação

Pode:

- ver todos os projetos;
- criar missões;
- aprovar conteúdos;
- emitir relatórios;
- acompanhar indicadores;
- editar equipes;
- gerir parceiros;
- aprovar experiências;
- acompanhar oportunidades e P&D.

## Líder de Projeto

Pode:

- gerir projeto específico;
- adicionar membros;
- criar missões;
- atualizar pipeline;
- registrar atividades;
- adicionar arquivos;
- gerar relatórios do projeto.

## Membro

Pode:

- ver projetos vinculados;
- atualizar suas missões;
- registrar atividades;
- enviar arquivos;
- comentar;
- registrar horas, quando habilitado.

## Professor / Orientador

Pode:

- acompanhar projetos vinculados;
- validar entregas;
- revisar documentos;
- emitir comentários;
- aprovar etapas, quando autorizado.

## Colaborador externo

Acesso apenas a recursos explicitamente compartilhados.

## Visualizador

Somente leitura.

### Requisito importante

As permissões devem existir em dois níveis:

1. perfil global;
2. participação em projeto específico.

---

# 14. DASHBOARD DO PORTAL

A tela inicial deve responder imediatamente:

- O que está acontecendo?
- O que precisa de atenção?
- O que vence em breve?
- Quais projetos estão avançando?
- Quais ações dependem de mim?

## Componentes

- saudação;
- projetos ativos;
- missões abertas;
- missões atrasadas;
- próximas entregas;
- atividades recentes;
- notificações;
- visitas próximas;
- aprovações pendentes;
- oportunidades recentes;
- atalhos rápidos.

Evitar gráfico apenas por decoração.

---

# 15. PROJETOS — PORTAL

## Hub

Permitir:

- buscar;
- filtrar;
- ordenar;
- criar projeto;
- arquivar;
- visualizar status;
- visualizar responsável;
- visualizar última atualização.

## Projeto individual

Tabs recomendadas:

- Visão Geral;
- Missões;
- Pipeline;
- Equipe;
- Cronograma;
- Arquivos;
- Galeria;
- Parceiros;
- Financeiro;
- Reuniões;
- Indicadores;
- Relatórios;
- Histórico.

Nem todo projeto precisa usar todas as abas.

O Administrador ou Coordenação deve conseguir ativar/desativar módulos por projeto.

---

# 16. MISSÕES

“Missão” é o nome principal para tarefas estruturadas.

## Campos

- título;
- projeto;
- descrição;
- responsável;
- participantes;
- prioridade;
- prazo;
- checklist;
- entregáveis;
- anexos;
- comentários;
- status;
- aprovação necessária ou não.

## Status

- Planejada;
- Em execução;
- Em validação;
- Concluída;
- Cancelada.

## Visualizações

- Kanban;
- Lista;
- Calendário.

## Ações rápidas

- atribuir responsável;
- alterar prazo;
- concluir;
- solicitar validação;
- comentar;
- anexar arquivo.

---

# 17. PIPELINE

O Portal deve permitir pipelines personalizados por projeto.

Exemplos:

## Comunicação

Ideia → Produção → Revisão → Aprovado → Publicado

## Projeto de Engenharia

Conceito → Projeto → Fabricação → Teste → Finalizado

## Captação / Edital

Mapeado → Em análise → Proposta → Submissão → Resultado

## Parceria

Prospectado → Contato → Reunião → Proposta → Negociação → Confirmado

## P&D

Desafio recebido → Triagem → Laboratório relacionado → Reunião → Proposta técnica → Projeto ativo → Entrega

O pipeline deve suportar campos customizados e histórico de movimentação.

---

# 18. REGISTRO DE ATIVIDADE

Nem tudo deve virar uma missão.

Criar “Registro de Atividade” para:

- reunião;
- decisão;
- visita;
- contato;
- atualização técnica;
- registro de avanço;
- anotação institucional.

Campos:

- data;
- projeto;
- participantes;
- descrição;
- decisões;
- próxima ação;
- anexos.

Isso forma o diário permanente do projeto.

---

# 19. PESSOAS E ACESSOS

Tela de gestão deve permitir:

- convidar pessoa;
- cadastrar papel;
- vincular a projetos;
- editar permissões;
- desativar acesso;
- ver último acesso;
- ver projetos vinculados;
- ver histórico de atividades.

## Perfil de pessoa

Exibir:

- nome;
- papel;
- projetos;
- missões concluídas;
- horas registradas;
- experiências;
- participação em eventos;
- documentos / certificados internos, quando aplicável.

No futuro, permitir gerar portfólio de participação.

---

# 20. CENTRAL DA COORDENAÇÃO

Criar uma visão específica para a coordenação.

Objetivo: permitir acompanhar o curso sem entrar em projeto por projeto.

## Deve mostrar

- projetos ativos;
- atrasados;
- projetos sem atualização;
- missões vencidas;
- aprovações pendentes;
- alunos envolvidos;
- professores envolvidos;
- empresas parceiras;
- visitas futuras;
- oportunidades abertas;
- desafios de P&D recebidos;
- relatórios pendentes;
- ações de extensão;
- indicadores do semestre.

## Alertas inteligentes

Exemplos:

- projeto sem atualização há 30 dias;
- missão crítica atrasada;
- parceiro sem follow-up;
- visita sem relatório;
- projeto concluído sem documentação final;
- publicação aguardando aprovação.

---

# 21. VISITAS / EXPERIÊNCIAS — PORTAL

Cada experiência deve ter:

- título;
- tipo;
- empresa/instituição;
- local;
- data;
- responsável;
- participantes;
- limite de vagas;
- roteiro;
- contatos;
- documentos;
- custos;
- inscrições;
- presença;
- fotos;
- relatório pós-visita;
- autorização para publicação.

## Fluxo

Planejamento → Inscrições → Documentação → Realização → Relatório → Publicação

---

# 22. PARCEIROS / CRM

Criar uma área institucional de relacionamento.

Cada organização deve ter:

- nome;
- logo;
- categoria;
- cidade/país;
- contatos;
- responsável interno;
- histórico de reuniões;
- projetos associados;
- visitas realizadas;
- propostas;
- oportunidades;
- última interação;
- próxima ação;
- documentos.

## Objetivo

Evitar que relacionamento institucional desapareça quando um aluno se forma ou uma equipe muda.

---

# 23. P&D / DESAFIOS EMPRESARIAIS

Criar um módulo específico.

Entrada pode vir de:

- formulário público;
- cadastro manual;
- reunião com empresa;
- contato de professor;
- parceiro existente.

## Registro do desafio

- empresa;
- contato;
- problema;
- área técnica;
- urgência;
- confidencialidade;
- anexos;
- laboratórios sugeridos;
- pesquisadores sugeridos;
- responsável pela triagem;
- status;
- histórico.

## Fluxo sugerido

Recebido → Triagem → Mapeamento de capacidade → Reunião → Proposta → Negociação → Projeto P&D → Entrega → Caso / publicação autorizada

---

# 24. OPORTUNIDADES E EDITAIS

Criar central para:

- estágio;
- bolsa;
- IC;
- extensão;
- editais de inovação;
- chamadas de P&D;
- competições;
- eventos;
- intercâmbio;
- missões internacionais.

## Campos

- título;
- organização;
- tipo;
- prazo;
- link;
- valor / benefício;
- elegibilidade;
- projetos relacionados;
- status;
- responsável;
- observações.

## Status

- Mapeada;
- Em análise;
- Candidatura / proposta em preparação;
- Submetida;
- Aprovada;
- Não aprovada;
- Encerrada.

---

# 25. ARQUIVOS E GOOGLE DRIVE

O Drive deve ser tratado como **acervo central**, não como simples link.

O Portal deve fornecer uma interface de navegação sobre arquivos vinculados.

## Exibir

- projeto;
- pasta;
- tipo;
- nome;
- data;
- autor;
- origem;
- visibilidade;
- status de publicação.

## Ações

- abrir arquivo;
- vincular a projeto;
- marcar como público;
- usar como capa;
- adicionar à galeria;
- marcar como documento oficial;
- arquivar.

## Fotos

Permitir:

- selecionar fotos para galeria pública;
- definir capa;
- inserir legenda;
- registrar créditos;
- registrar autorização de uso.

---

# 26. APROVAÇÕES E PUBLICAÇÃO NO SITE

Criar uma central de aprovação.

Tipos:

- notícia;
- atualização de projeto;
- foto;
- evento;
- experiência;
- texto institucional;
- parceiro;
- resultado de P&D autorizável.

## Fluxo

Rascunho → Revisão → Aprovado → Publicado

Ou:

Rascunho → Revisão → Solicitar alteração → Revisado → Aprovado → Publicado

Registrar:

- autor;
- aprovador;
- comentários;
- data;
- histórico de versões.

---

# 27. FINANCEIRO E CAPTAÇÃO

Não transformar em sistema contábil.

Objetivo: visão gerencial dos projetos.

## Campos

- orçamento previsto;
- fonte;
- edital;
- patrocinador;
- valor solicitado;
- valor aprovado;
- valor recebido;
- despesas principais;
- comprovantes;
- saldo;
- status da captação.

Permissões restritas.

---

# 28. RELATÓRIOS E INDICADORES

A área deve permitir gerar relatórios a partir dos dados existentes.

## Relatórios sugeridos

- Relatório de Projeto;
- Relatório de Extensão;
- Relatório de P&D;
- Relatório Semestral;
- Relatório de Visita Técnica;
- Prestação de Contas;
- Portfólio Institucional;
- Relatório de Participação de Aluno;
- Relatório de Parceiros;
- Relatório de Impacto.

## Filtros

- período;
- projeto;
- categoria;
- equipe;
- atividade;
- empresa;
- status.

## Indicadores

- projetos ativos;
- projetos concluídos;
- missões concluídas;
- taxa de atraso;
- visitas realizadas;
- participantes;
- alunos impactados;
- empresas conectadas;
- desafios P&D;
- oportunidades submetidas;
- horas registradas;
- publicações;
- alcance de ações, quando informado.

Não exibir métricas inventadas.

---

# 29. CALENDÁRIO E NOTIFICAÇÕES

## Calendário

Consolidar:

- reuniões;
- prazos;
- missões;
- visitas;
- eventos;
- editais;
- entregas;
- aprovações.

## Notificações

Exemplos:

- missão atribuída;
- prazo próximo;
- missão atrasada;
- arquivo enviado;
- comentário;
- aprovação solicitada;
- conteúdo aprovado;
- convite para projeto;
- visita confirmada;
- oportunidade próxima do prazo.

Permitir preferências de notificação.

---

# 30. FORMULÁRIOS INTERNOS

Criar um sistema reutilizável para:

- inscrição em visita;
- candidatura a projeto;
- submissão de ideia;
- avaliação pós-evento;
- registro de horas;
- pedido de apoio;
- seleção de bolsistas;
- envio de desafio P&D.

Resultados devem alimentar dados do Portal quando apropriado.

---

# 31. HISTÓRICO E MEMÓRIA INSTITUCIONAL

Projetos concluídos não devem desaparecer.

Após conclusão, manter:

- equipe;
- período;
- atividades;
- resultados;
- fotos;
- documentos;
- parceiros;
- indicadores;
- lições aprendidas;
- relatórios;
- publicações.

Criar visão por ano e por projeto.

---

# 32. AUDITORIA E SEGURANÇA DE EXPERIÊNCIA

Sem entrar em tecnologia, o produto precisa preservar histórico de ações importantes.

Registrar:

- quem criou;
- quem editou;
- quem aprovou;
- quem removeu;
- quando ocorreu;
- qual era o estado anterior, quando relevante.

Ações destrutivas devem pedir confirmação.

Conteúdo sensível deve respeitar permissões.

---

# 33. ESTADOS DE INTERFACE

Todas as telas importantes devem possuir estados bem desenhados para:

- vazio;
- carregando;
- erro;
- sem permissão;
- sem resultados;
- sucesso;
- item arquivado;
- item concluído;
- item atrasado.

Nunca deixar área em branco sem explicação.

---

# 34. EXPERIÊNCIA MOBILE E RESPONSIVA

O projeto não pode ser apenas desktop.

## Site público

Prioridade total para leitura e descoberta em celular.

## Portal

Em mobile, priorizar:

- minhas missões;
- notificações;
- agenda;
- projetos;
- registrar atividade;
- upload de foto/arquivo;
- aprovar / comentar;
- consultar contatos.

Tabelas extensas devem virar listas/cards ou permitir navegação adequada.

---

# 35. ACESSIBILIDADE

Garantir:

- contraste adequado;
- foco visível;
- navegação por teclado;
- labels de campos;
- alt text em imagens públicas;
- ícones acompanhados de texto quando necessário;
- estados de erro claros;
- não depender apenas de cor;
- animações reduzíveis.

---

# 36. O QUE DEVE SER ALTERADO NO SITE ATUAL

## Problemas percebidos no site original

- visual excessivamente escuro;
- muitas seções com aparência semelhante;
- grandes áreas vazias ou pouco informativas;
- projetos aparecem mais como itens de menu do que como portfólio vivo;
- pouca presença de fotos reais;
- pouca separação entre público futuro aluno, comunidade e empresas;
- “Visitas” isolado quando o conceito é maior;
- falta de bilinguismo;
- falta de integração clara com o Portal;
- área “Para Empresas” inexistente / insuficiente;
- páginas não demonstram plenamente os laboratórios e capacidades de P&D;
- Portal ainda não representa a visão de gestão discutida.

## Mudança desejada

Transformar o site de:

> **site institucional escuro com páginas estáticas**

para:

> **plataforma institucional clara, editorial, viva e conectada a um Portal de gestão.**

---

# 37. ORDEM RECOMENDADA DE IMPLEMENTAÇÃO

## Fase 1 — Base visual

- revisar layout global;
- aplicar header/footer novos;
- aplicar paleta clara;
- ajustar tipografia;
- implementar PT/EN visualmente;
- padronizar componentes e estados.

## Fase 2 — Site público principal

- Home;
- O Curso;
- Projetos;
- Projeto individual;
- Experiências;
- Notícias;
- Comunidade;
- Para Empresas.

## Fase 3 — Portal base

- login / sessão;
- dashboard;
- pessoas e permissões;
- projetos;
- projeto individual;
- missões;
- pipeline;
- arquivos.

## Fase 4 — Gestão institucional

- visitas;
- parceiros;
- oportunidades;
- P&D;
- aprovações;
- calendário;
- relatórios.

## Fase 5 — Integração site ↔ Portal

- publicação de projetos;
- notícias;
- experiências;
- fotos;
- indicadores;
- parceiros;
- casos de P&D autorizados.

## Fase 6 — Refinamento

- microinterações;
- responsividade;
- acessibilidade;
- estados vazios;
- consistência visual;
- performance percebida;
- revisão de conteúdo PT/EN.

---

# 38. CHECKLIST DE ACEITAÇÃO VISUAL

Antes de considerar uma tela pronta, verificar:

- [ ] Está clara e leve?
- [ ] Parece parte da mesma plataforma das referências?
- [ ] Usa a logo correta?
- [ ] O laranja está sendo usado como destaque, não como excesso?
- [ ] Existe hierarquia clara?
- [ ] A página tem propósito evidente em 5 segundos?
- [ ] O CTA principal está visível?
- [ ] Fotos são relevantes e ajudam a contar a história?
- [ ] Não há cards demais com a mesma aparência?
- [ ] O layout funciona sem animação?
- [ ] O estado mobile está pensado?
- [ ] PT/EN está previsto?
- [ ] Não há dados fictícios apresentados como fatos?

---

# 39. CHECKLIST DE ACEITAÇÃO DO PORTAL

- [ ] Pessoas têm papéis e permissões claras.
- [ ] Usuário vê apenas o que deveria ver.
- [ ] Projeto possui equipe e status.
- [ ] Projeto pode ter missões.
- [ ] Missões têm responsável e prazo.
- [ ] Missões podem ser validadas.
- [ ] Há histórico de atividade.
- [ ] Pipeline é adaptável.
- [ ] Arquivos podem ser vinculados.
- [ ] Visitas possuem planejamento e pós-visita.
- [ ] Parceiros possuem histórico de relacionamento.
- [ ] P&D recebe desafios externos.
- [ ] Oportunidades possuem status.
- [ ] Coordenação possui visão transversal.
- [ ] Conteúdo pode seguir fluxo de aprovação.
- [ ] Relatórios usam dados do Portal.
- [ ] Projetos concluídos permanecem como memória institucional.

---

# 40. NORTE FINAL PARA CODEX / CLAUDE

Ao trabalhar neste projeto, não pensar apenas em “reproduzir telas”.

Pensar no produto como um sistema que conecta:

**curso + alunos + professores + projetos + empresas + laboratórios + experiências + memória institucional.**

A plataforma precisa funcionar para quatro grupos simultaneamente:

1. **Futuro aluno** — quero entender o curso e imaginar minha vida nele.
2. **Aluno atual** — quero participar, executar e encontrar oportunidades.
3. **Coordenação / professores** — quero acompanhar, organizar e gerar evidências do que está acontecendo.
4. **Empresa** — quero descobrir competências, laboratórios, talentos e caminhos de colaboração.

Se uma nova tela ou função não melhora a experiência de pelo menos um desses públicos, questionar se ela realmente é necessária.

A direção final deve transmitir:

> **Engenharia que conecta pessoas, conhecimento e infraestrutura para mover o futuro sobre trilhos.**

