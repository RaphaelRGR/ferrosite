# Inventário editorial (quarentena BASE-002)

Gerado de `content/editorial-inventory.json` em 2026-09-15 — não editar à mão; edite o JSON e rode `npm run content:report`.

Política: nada abaixo é publicado como fato. Em modo `review` (default) o site exibe o conteúdo com o selo **"Conteúdo em verificação"**; em `strict` (`NEXT_PUBLIC_CONTENT_MODE=strict`) o conteúdo não verificado não é renderizado. Uma entrada só deixa a quarentena com `status: VERIFIED`, `source`, `owner`, `verified_at` e `decision: confirmar`.

## Resumo

| Total | UNVERIFIED | VERIFIED | DISCARDED | Seções |
|---|---|---|---|---|
| 105 | 104 | 0 | 1 | 43 |

Por tipo: claim 19 · metric 17 · narrative 17 · visit 12 · event 8 · news 8 · image 5 · partner 4 · curriculum 4 · cta 4 · date 3 · legal 2 · person 2

## Decisões pendentes (owner humano)

Para cada linha: **confirmar** (com fonte primária e responsável), **corrigir** (novo valor + fonte) ou **descartar**.

### Hero da Home — `home.hero`

Rota: `(legado sem consumidor — substituído em PUBLIC-001)` · Código: `src/i18n/dictionaries/pt.ts (hero) + src/components/sections/HeroSection.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `home.hero.badge` | claim | Portal não oficial | — | — | UNVERIFIED | — | — | Relação FerroSite/Comunica Ferro/curso indefinida (35). |
| `home.hero.unico-sc` | claim | O único curso de Santa Catarina. | — | — | UNVERIFIED | — | — | Conflita com 'Único no Brasil' (CursoHero) e 'primeiro do Sul' (AboutHistory). Ver 33. |
| `home.hero.video` | image | public/videos/hero.mp4 (~35 MB) | — | — | UNVERIFIED | — | — | Origem, direitos e conteúdo (locomotiva a vapor) não documentados; 25 pede IMG-002. |

### Manifesto (R$ 600 bi) — `home.manifesto`

Rota: `(legado sem consumidor — substituído em PUBLIC-001)` · Código: `src/components/sections/ManifestoSection.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `home.manifesto.600bi` | metric | R$ 600 bilhões em investimentos previstos para o setor ferroviário brasileiro. | — | — | UNVERIFIED | — | — | Sem fonte no repositório; repetido em HowItWorks. |
| `home.manifesto.ctj` | claim | Os engenheiros que vão executar isso estão sendo formados agora, no CTJ. | — | — | UNVERIFIED | — | — | — |

### Números animados — `home.numbers`

Rota: `(legado sem consumidor — substituído em PUBLIC-001)` · Código: `src/components/sections/NumbersSection.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `home.numbers.1o` | metric | 1º — Curso focado em Engenharia Ferroviária no Brasil | — | — | UNVERIFIED | — | — | — |
| `home.numbers.103bi` | metric | R$ 103 Bi — Previstos no Novo PAC para obras em ferrovias | — | — | UNVERIFIED | — | — | Conflita com R$ 600 bi do manifesto; fonte (Novo PAC) não referenciada. |
| `home.numbers.30000km` | metric | +30.000 km — De malha ferroviária em expansão e modernização no país | — | — | UNVERIFIED | — | — | — |
| `home.numbers.15anos` | metric | 15 anos — De tradição formando a elite técnica do setor (desde 2009) | — | — | UNVERIFIED | — | — | Depende da data de criação (2009 em StoryJourney vs 2014 em AboutHistory). |

### A Engenharia que move o país — `home.about`

Rota: `(legado sem consumidor — substituído em PUBLIC-001)` · Código: `src/components/sections/AboutSection.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `home.about.unico-sc` | claim | O único curso de Santa Catarina. | — | — | UNVERIFIED | — | — | — |
| `home.about.narrativa` | narrative | Formamos profissionais para projetar, construir e operar os sistemas que são a espinha dorsal da logística nacional. […] | — | — | UNVERIFIED | — | — | — |
| `home.about.foto` | image | [ foto em breve ] (placeholder) | — | — | UNVERIFIED | — | — | — |

### Jornada acadêmica (4 etapas) — `home.how-it-works`

Rota: `(legado sem consumidor — substituído em PUBLIC-001)` · Código: `src/components/sections/HowItWorksSection.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `home.how.vagas` | metric | 20 vagas por semestre via SiSU e Vestibular UFSC. Turno integral, 5 anos de formação técnica e humanística no CTJ — Joinville. | — | — | UNVERIFIED | — | — | Vagas, ingresso, turno e duração: confirmar com a coordenação/edital. |
| `home.how.pratica` | narrative | Visitas técnicas a concessionárias, laboratórios e operadoras. Contato real com locomotivas, via permanente e sistemas de sinalização. | — | — | UNVERIFIED | — | — | — |
| `home.how.ifmg` | partner | Parceria com IFMG Santos Dumont. Competições como Cavalos de Ferro. Projetos do Comunica Ferro […] | — | — | UNVERIFIED | — | — | Parceria com IFMG precisa de instrumento/autorização. |
| `home.how.mercado` | claim | Rumo, MRS, VLI, Vale, ANPTrilhos. O Brasil vai investir R$ 600 bilhões em ferrovias. Os engenheiros que vão executar isso saem daqui. | — | — | UNVERIFIED | — | — | Empresas citadas como destino; R$ 600 bi sem fonte. |

### Inovação nos Trilhos — `home.innovation`

Rota: `(legado sem consumidor — substituído em PUBLIC-001)` · Código: `src/components/sections/InnovationSection.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `home.innovation.15projetos` | metric | 15+ Projetos Ativos | — | — | UNVERIFIED | — | — | — |
| `home.innovation.excelencia` | claim | UFSC — Excelência Acadêmica | — | — | UNVERIFIED | — | — | — |
| `home.innovation.lab` | claim | Laboratório de Inovação — Centro Tecnológico de Joinville | — | — | UNVERIFIED | — | — | Nome de laboratório não consta no portfólio de laboratórios (14). |
| `home.innovation.linhas` | narrative | Sistemas Autônomos; Manutenção Preditiva (IA para fadiga em trilhos); Energia Sustentável — descrições de pesquisa | — | — | UNVERIFIED | — | — | Confrontar com linhas reais dos labs (14). |
| `home.innovation.imagem` | image | images.unsplash.com/photo-1515165599668… (remota, alt 'Tecnologia Ferroviária') | — | — | UNVERIFIED | — | — | Placeholder não documental; 25 exige foto real/autorizada ou conceito claramente marcado. |

### Calendário de Visitas (resumo) — `home.visits`

Rota: `(legado sem consumidor — substituído em PUBLIC-001)` · Código: `src/components/sections/VisitsSection.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `home.visits.rumo` | visit | RUMO Logística — 18 Jun 2026 — Visita ao CCO da maior operadora do país | — | — | UNVERIFIED | — | — | — |
| `home.visits.buenos-aires` | visit | Buenos Aires, ARG — Jul 2026 — Intercâmbio técnico com a UTN e visita à rede metroviária Emova | — | — | UNVERIFIED | — | — | — |
| `home.visits.polo-mineiro` | visit | Polo Mineiro — Nov 2026 — Imersão no complexo ferroviário de Minas Gerais e oficinas da VLI | — | — | UNVERIFIED | — | — | — |
| `home.visits.status` | claim | Rótulos de status (Inscrições abertas / Em breve) sem sistema real por trás | — | — | UNVERIFIED | — | — | Affordance falsa; PUBLIC-002. |

### Agenda de Eventos (resumo) — `home.events`

Rota: `(legado sem consumidor — substituído em PUBLIC-001)` · Código: `src/components/sections/EventsSection.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `home.events.cavalos-2026` | event | Cavalos de Ferro 2026 — 01 Julho — 'A maior competição estudantil de engenharia ferroviária das Américas' — Inscrições Abertas | — | — | UNVERIFIED | — | — | Superlativo sem fonte; data/inscrição não confirmadas. |
| `home.events.hackferro` | event | HackFerro — Setembro — Desenvolvendo soluções tecnológicas […] — Em Breve | — | — | UNVERIFIED | — | — | — |

### Carrossel de logos — `home.companies`

Rota: `(legado sem consumidor — substituído em PUBLIC-001)` · Código: `src/components/sections/CompaniesSection.tsx + public/empresas/*.png`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `home.companies.rotulo` | claim | Empresas parceiras e destinos de egressos | — | — | UNVERIFIED | — | — | Parceria e destino de egressos são relações diferentes (33); categorizar cada empresa. |
| `home.companies.logos` | partner | Rumo Logística, MRS Logística, VLI, Vale, ANPTrilhos, FTC, Lanfranco (logos em public/empresas) | — | — | UNVERIFIED | — | — | Autorização de uso de marca por empresa: pendente (35). |

### Rede de Colaboração — `home.partners`

Rota: `(legado sem consumidor — substituído em PUBLIC-001)` · Código: `src/components/sections/PartnersSection.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `home.partners.lista` | partner | ANTT, DNIT, VALE, MRS, RUMO, VLI (placeholders estilizados) | — | — | UNVERIFIED | — | — | Órgãos reguladores listados como 'parceiros estratégicos' sem instrumento. |
| `home.partners.texto` | claim | Mantemos parcerias estratégicas com os principais órgãos reguladores e concessionárias de ferrovias do país […] | — | — | UNVERIFIED | — | — | — |

### Hero do Curso — `curso.hero`

Rota: `(legado sem consumidor — substituído em PUBLIC-001)` · Código: `src/components/sections/CursoHero.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `curso.hero.unico-brasil` | claim | Único no Brasil | — | — | UNVERIFIED | — | — | Conflita com 'único de SC' e 'primeiro do Sul'; MetricsSection (não usada) diz '3 de 3 cursos no Brasil'. |
| `curso.hero.elite` | claim | Projetado do zero para dominar a malha logística. Formamos a elite técnica disputada pelas maiores gigantes da infraestrutura do país. | — | — | UNVERIFIED | — | — | — |

### Os 4 pilares da formação — `curso.pillars-legacy`

Rota: `(legado sem consumidor — substituído em PUBLIC-001)` · Código: `src/components/sections/CoursePillars.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `curso.pillars-legacy.texto` | narrative | Material Rodante; Via Permanente; Sinalização (O Cérebro da Malha); Logística (A Eficiência Total) — descrições | — | — | UNVERIFIED | — | — | Confrontar com PPC; '15.000 toneladas', '80km/h' são exemplos ilustrativos. |

### Atribuição profissional (CREA) — `curso.crea`

Rota: `(legado sem consumidor — substituído em PUBLIC-001)` · Código: `src/components/sections/CourseCrea.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `curso.crea.dupla` | legal | Nossos egressos não têm restrições. A estrutura da matriz curricular confere dupla atribuição no CREA/CONFEA, integrando os profissionais à Câmara de Engenharia Mecânica […] | — | — | UNVERIFIED | — | — | Redação jurídica precisa de validação (CREA-SC/CONFEA; Art. 12). Risco alto (33). |
| `curso.crea.lista` | legal | Projetos mecânicos, termodinâmicos e de fluidos; Responsabilidade técnica em plantas industriais; Peritagem e emissão de laudos; Especialidade adicional restrita em operação e via ferroviária | — | — | UNVERIFIED | — | — | — |

### Fluxograma curricular (matrizes 2025/2016/2012) — `curso.curriculum`

Rota: `/curso` · Código: `content/curriculum/*.json (gerado dos PDFs oficiais por scripts/curriculum_from_pdf.py) + src/data/curriculums.ts`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `curso.curriculum.2025` | curriculum | Matriz 2025 (currículo 20251): 62 obrigatórias (incl. atividades complementares/extensão) + 24 optativas | public/grades/grade2025.pdf — CURRÍCULO DO CURSO 604, SeTIC/UFSC (sha256 no JSON) | — | UNVERIFIED | — | — | Estrutura, cargas, pré-requisitos e ementas extraídos do PDF em 2026-09-15. Falta owner/verified_at institucional. |
| `curso.curriculum.2016` | curriculum | Matriz 2016: 61 obrigatórias (4 slots de optativa obrigatória) + 28 optativas | public/grades/grade2016.pdf (sha256 no JSON) | — | UNVERIFIED | — | — | Pré-requisitos EMB5109 e EMB5628 citados no PDF não pertencem ao currículo (registrados em unknownPrerequisites). |
| `curso.curriculum.2012` | curriculum | Matriz 2012: 61 obrigatórias + 7 optativas | public/grades/grade2012.pdf (sha256 no JSON) | — | UNVERIFIED | — | — | O PDF não traz pré-requisitos: as arestas exibidas são as legadas do protótipo (prerequisitesSource=legacy-unverified), incluindo EMB5512→EMB5107 e EMB5605→EMB5116 (ambas fase 6). Confirmar com a coordenação. |
| `curso.curriculum.ementas` | narrative | Ementas editoriais do protótipo (13/15/10 disciplinas) — substituídas pelas ementas oficiais do PDF; texto preservado em src/data/curriculums.legacy.ts | — | — | DISCARDED | — | descartar | Não eram ementas oficiais. Removidas da UI em FLOW-001. |

### Hero do Sobre — `sobre.hero`

Rota: `/sobre` · Código: `src/components/sections/AboutHero.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `sobre.hero.titulo` | claim | Nossa História & Propósito — A Engenharia que Transforma o Brasil | — | — | UNVERIFIED | — | — | — |

### Uma Jornada de Inovação (linha do tempo) — `sobre.story`

Rota: `/sobre` · Código: `src/components/sections/StoryJourney.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `sobre.story.2009` | date | 04 Agosto 2009 — Criado através do programa REUNI, o curso inicia suas atividades na inauguração do campus de Joinville da UFSC. Fomos o primeiro c[urso…] | — | — | UNVERIFIED | — | — | AboutHistory (não usado) diz 2014. Fonte: ato de criação/PPC. |
| `sobre.story.2013` | person | 2013 / 2014 — Marcos Imhof se torna oficialmente o primeiro Engenheiro Ferroviário graduado do país pela nossa instituição | — | — | UNVERIFIED | — | — | Dado pessoal + alegação 'primeiro do país': consentimento e fonte. |
| `sobre.story.2023` | claim | 2023 — Excelência Científica — premiação de melhor trabalho no Encontro de Físi[ca…] | — | — | UNVERIFIED | — | — | Nome do evento, edição e comprovante. |
| `sobre.story.2024` | claim | 2024 — UFSC Joinville indicada como Melhor Instituição de Ensino no Prêmio Revista Ferroviária; egressos faturam o Prêmio Inovação da ANTT | — | — | UNVERIFIED | — | — | Links/atos oficiais dos prêmios. |
| `sobre.story.comunica` | narrative | O Presente — Projeto Comunica Ferro — 'estratégia agressiva de comunicação e do nosso Instagram oficial' […] | — | — | UNVERIFIED | — | — | — |
| `sobre.story.ferrolab` | narrative | O Futuro — A Conquista do FerroLab: laboratório operando de dentro de um container real […] | — | — | UNVERIFIED | — | — | Projeto futuro apresentado como plano; status real desconhecido. |

### Missão, Visão e Valores — `sobre.identity`

Rota: `/sobre` · Código: `src/components/sections/AboutIdentity.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `sobre.identity.mvv` | narrative | Missão ('preencher um vazio histórico na logística nacional'), Visão ('epicentro da inovação metroferroviária na América Latina'), Valores | — | — | UNVERIFIED | — | — | Missão/visão/valores oficiais não localizados (35). |

### Linhas de Pesquisa — `sobre.research`

Rota: `/sobre` · Código: `src/components/sections/AboutResearch.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `sobre.research.linhas` | narrative | Dinâmica Ferroviária e Roda-Trilho; Logística e Otimização de Malhas; Via Permanente e Infraestrutura; Sinalização e Controle de Tráfego | — | — | UNVERIFIED | — | — | Confrontar com portfólio de laboratórios (14) e grupos de pesquisa reais. |
| `sobre.research.claim` | claim | Somos o braço de pesquisa e desenvolvimento que as grandes concessionárias procuram […] | — | — | UNVERIFIED | — | — | — |

### Hero de Visitas — `visitas.hero`

Rota: `/experiencias` · Código: `src/components/sections/VisitsHero.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `visitas.hero.texto` | narrative | Experiência em Campo — A VIDA NOS [TRILHOS] — Onde a teoria da sala de aula encontra a magnitude da Engenharia Ferroviária | — | — | UNVERIFIED | — | — | — |

### Números de visitas — `visitas.stats`

Rota: `/experiencias` · Código: `src/components/sections/VisitsStats.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `visitas.stats.48` | metric | 48+ Visitas Realizadas | — | — | UNVERIFIED | — | — | — |
| `visitas.stats.15` | metric | 15 Empresas Parceiras | — | — | UNVERIFIED | — | — | — |
| `visitas.stats.1200` | metric | 1.2k Alunos Impactados | — | — | UNVERIFIED | — | — | — |
| `visitas.stats.3paises` | metric | 03 Países Visitados | — | — | UNVERIFIED | — | — | — |

### Memórias Técnicas (galeria) — `visitas.gallery`

Rota: `/experiencias` · Código: `src/components/sections/VisitsGallery.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `visitas.gallery.rumo-2023` | visit | CCO Rumo Logística — Curitiba - PR — 2023 — 'maior Centro de Controle Operacional da América Latina' | — | — | UNVERIFIED | — | — | — |
| `visitas.gallery.vli` | visit | Terminal de Grãos (VLI) — Santos - SP — 'maior porto do país' | — | — | UNVERIFIED | — | — | — |
| `visitas.gallery.mrs-2024` | visit | Oficinas da MRS — Jundiaí - SP — 2024 | — | — | UNVERIFIED | — | — | — |
| `visitas.gallery.vale-2022` | visit | Vale - EFVM — Vitória - ES — 2022 | — | — | UNVERIFIED | — | — | — |
| `visitas.gallery.imagens` | image | Imagens remotas Unsplash usadas como fotos das visitas | — | — | UNVERIFIED | — | — | Fotografia documental deve ser real e autorizada (25). |
| `visitas.gallery.relatorio` | cta | Ver Relatório Técnico → (sem destino) | — | — | UNVERIFIED | — | — | — |

### Próximos embarques — `visitas.schedule`

Rota: `/experiencias` · Código: `src/components/sections/VisitsSchedule.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `visitas.schedule.rumo` | visit | RUMO Logística — 18 Jun 2026 — CCO e oficinas em Curitiba | — | — | UNVERIFIED | — | — | — |
| `visitas.schedule.utn` | visit | UTN - Buenos Aires — Jul 2026 — Missão Internacional | — | — | UNVERIFIED | — | — | — |
| `visitas.schedule.vli` | visit | VLI Logística — Set 2026 — Terminal Integrador Portuário (TIP) em Santos | — | — | UNVERIFIED | — | — | — |
| `visitas.schedule.vale` | visit | Vale - EFVM — Nov 2026 | — | — | UNVERIFIED | — | — | — |
| `visitas.schedule.regra` | claim | As inscrições para visitas técnicas são exclusivas para alunos do curso e abrem geralmente 30 dias antes da data prevista. | — | — | UNVERIFIED | — | — | Regra de processo não confirmada; botão 'Ver Edital de Seleção' sem destino. |

### Hero de Eventos — `eventos.hero`

Rota: `/eventos` · Código: `src/components/sections/EventsHero.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `eventos.hero.calendario` | date | Calendário 2026 — De competições internacionais a workshops técnicos […] | — | — | UNVERIFIED | — | — | — |

### Evento principal — `eventos.featured`

Rota: `/eventos` · Código: `src/components/sections/FeaturedEvent.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `eventos.featured.cavalos` | event | Cavalos de Ferro 2026 — 01-05 Julho 2026 — Santa Catarina — 'A maior competição estudantil de engenharia ferroviária das Américas' — Edição de Aniversário: 10 anos | — | — | UNVERIFIED | — | — | Datas, local, superlativo e '10 anos' sem fonte; botão 'Inscrever Equipe' sem ação. |

### Próximos encontros — `eventos.grid`

Rota: `/eventos` · Código: `src/components/sections/EventsGrid.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `eventos.grid.hackferro` | event | HackFerro 2026 — Maratona de programação […] | — | — | UNVERIFIED | — | — | — |
| `eventos.grid.simposio` | event | Simpósio Sul de Ferrovias — Apresentação de artigos científicos […] | — | — | UNVERIFIED | — | — | — |
| `eventos.grid.rumo` | event | Visita Técnica: Rumo Logística — 'maior concessionária do país' | — | — | UNVERIFIED | — | — | — |
| `eventos.grid.ertms` | event | Workshop: Sinalização ERTMS | — | — | UNVERIFIED | — | — | — |
| `eventos.grid.filtros` | cta | Filtros de categoria sem ação | — | — | UNVERIFIED | — | — | PUBLIC-002. |

### Galeria de eventos passados — `eventos.past`

Rota: `/eventos` · Código: `src/components/sections/PastEventsGallery.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `eventos.past.lista` | event | Semana Acadêmica 2025; Visita Vale Tubarão; Competição Cavalos de Ferro 2024; Workshop Sinalização | — | — | UNVERIFIED | — | — | — |
| `eventos.past.imagens` | image | 4 imagens remotas Unsplash como registro de eventos | — | — | UNVERIFIED | — | — | — |
| `eventos.past.cta` | cta | Ver Galeria → (sem destino) | — | — | UNVERIFIED | — | — | — |

### Hero de Notícias — `noticias.hero`

Rota: `/noticias` · Código: `src/components/sections/NewsHero.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `noticias.hero.texto` | narrative | News & Updates — O QUE HÁ DE NOVO NOS TRILHOS | — | — | UNVERIFIED | — | — | Mistura EN/PT no PT. |

### Notícia em destaque — `noticias.featured`

Rota: `/noticias` · Código: `src/components/sections/NewsFeatured.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `noticias.featured.hidrogenio` | news | 12 Maio, 2026 — UFSC Joinville lidera pesquisa sobre hidrogênio verde em trens. — 'projeto inovador que visa substituir motores diesel por células de combustível a hidrogênio' […] | — | — | UNVERIFIED | — | — | Notícia sem fonte; pode ser fictícia. |
| `noticias.featured.autor` | person | Raphael Garcia — Editor Chefe | — | — | UNVERIFIED | — | — | Dado pessoal; cargo não confirmado. |

### Arquivo de notícias — `noticias.grid`

Rota: `/noticias` · Código: `src/components/sections/NewsGrid.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `noticias.grid.08mai` | news | 08 Mai — Novos laboratórios de sinalização são inaugurados no CTJ. | — | — | UNVERIFIED | — | — | — |
| `noticias.grid.05mai` | news | 05 Mai — Setor ferroviário prevê contratação recorde de engenheiros. | — | — | UNVERIFIED | — | — | — |
| `noticias.grid.02mai` | news | 02 Mai — Projeto Cavalos de Ferro recebe patrocínio da Rumo. | — | — | UNVERIFIED | — | — | Cita empresa como patrocinadora: exige confirmação da empresa. |
| `noticias.grid.28abr` | news | 28 Abr — Alunos desenvolvem sensor IoT para monitoramento de trilhos. | — | — | UNVERIFIED | — | — | — |
| `noticias.grid.25abr` | news | 25 Abr — I Simpósio de Ferrovias Sustentáveis reúne especialistas. | — | — | UNVERIFIED | — | — | — |
| `noticias.grid.20abr` | news | 20 Abr — Pós-graduação em Engenharia de Via Permanente abre inscrições. | — | — | UNVERIFIED | — | — | — |
| `noticias.grid.paginacao` | cta | Setas ← → e 'Carregar mais notícias' sem ação | — | — | UNVERIFIED | — | — | PUBLIC-002. |

### Newsletter — `noticias.newsletter`

Rota: `/noticias` · Código: `src/components/sections/NewsNewsletter.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `noticias.newsletter.promessa` | claim | Toda semana, uma curadoria especial com as principais notícias […] *Não enviamos spam. Cancele a qualquer momento. | — | — | UNVERIFIED | — | — | Serviço inexistente; formulário cancela o submit; coleta de e-mail sem política de privacidade (LGPD). |

### Componentes sem uso com afirmações — `unused.metrics`

Rota: `(sem consumidor)` · Código: `src/components/sections/MetricsSection.tsx, AboutHistory.tsx, AboutPillars.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `unused.metrics.3de3` | metric | 3 de 3 — Cursos de Eng. Ferroviária no Brasil; 9.000 km — Malha ferroviária em leilão; 2026 — Ano do 1º HackFerro | — | — | UNVERIFIED | — | — | Não renderizado; contradiz 'único no Brasil'. |
| `unused.history.2014` | date | 2014 Fundação do Curso; 2018 Criação do Comunica Ferro; 2020 Lançamento do FerroSite; 2024 Referência Nacional | — | — | UNVERIFIED | — | — | Não renderizado; conflita com 2009 (StoryJourney). |
| `unused.pillars.sul` | claim | único curso de Engenharia Ferroviária e Metroviária do Sul do Brasil | — | — | UNVERIFIED | — | — | Não renderizado; terceira variante do superlativo. |

### Home — indicadores — `home.indicators`

Rota: `/` · Código: `src/components/public/home/HomeSections.tsx (IndicatorsStrip) + src/content/staging.ts INDICATORS`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `home.indicators.1o` | metric | 1º — Curso focado em Engenharia Ferroviária no Brasil | — | — | UNVERIFIED | — | — | Herdado de NumbersSection; conflita com variantes de pioneirismo. |
| `home.indicators.103bi` | metric | R$ 103 bi — Previstos no Novo PAC para obras em ferrovias | — | — | UNVERIFIED | — | — | Fonte (Novo PAC) não referenciada. |
| `home.indicators.30000km` | metric | +30.000 km — De malha ferroviária em expansão e modernização | — | — | UNVERIFIED | — | — | — |
| `home.indicators.48visitas` | metric | 48+ — Visitas técnicas realizadas | — | — | UNVERIFIED | — | — | Herdado de VisitsStats. |

### Home — projetos em destaque — `home.projects`

Rota: `/` · Código: `HomeSections.tsx (FeaturedProjects) + staging FEATURED_PROJECTS`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `home.projects.lista` | narrative | Comunica Ferro (Comunicação); Cavalos de Ferro (Competição); Ferro Lab (Extensão); Projetos de Extensão ([CONTEÚDO PENDENTE]) | — | — | UNVERIFIED | — | — | Nomes vindos da Navbar; categorias e descrições são paráfrases do copy legado, sem cadastro oficial. |

### Home — experiências — `home.experiences`

Rota: `/` · Código: `HomeSections.tsx (ExperiencesPreview) + staging EXPERIENCES`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `home.experiences.lista` | visit | Vale-EFVM 2022; CCO Rumo 2023; Oficinas MRS 2024; RUMO 18 jun 2026; UTN Buenos Aires jul 2026; VLI set 2026 | — | — | UNVERIFIED | — | — | Herdado de VisitsGallery/VisitsSchedule. |

### Home — notícias — `home.news`

Rota: `/` · Código: `HomeSections.tsx (NewsPreview) + staging NEWS`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `home.news.lista` | news | Hidrogênio verde (12 mai 2026); Laboratórios de sinalização (08 mai 2026); Sensor IoT (28 abr 2026) | — | — | UNVERIFIED | — | — | Herdado de NewsFeatured/NewsGrid; possivelmente fictícias. |

### Home — faixa de logos — `home.partners-strip`

Rota: `/` · Código: `HomeSections.tsx (PartnersStrip) + staging PARTNER_LOGOS`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `home.partners-strip.logos` | partner | Rumo, MRS, VLI, Vale, ANPTrilhos, FTC, Lanfranco | — | — | UNVERIFIED | — | — | Autorização de marca e classificação do vínculo pendentes. |

### Curso — sobre — `curso.about`

Rota: `/curso` · Código: `CourseSections.tsx (AboutCourse) + staging ABOUT_COURSE_TEXT`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `curso.about.texto` | narrative | Formamos profissionais para projetar, construir e operar […] é referência técnica e inovação no setor. | — | — | UNVERIFIED | — | — | Herdado de AboutSection; 'referência técnica' sem fonte. |

### Curso — dados básicos — `curso.facts`

Rota: `/curso` · Código: `CourseSections.tsx (AboutCourse) + staging COURSE_FACTS`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `curso.facts.dados` | metric | 5 anos (10 fases); Integral, presencial em Joinville; SiSU e Vestibular UFSC; 20 vagas por semestre | — | — | UNVERIFIED | — | — | Herdado de HowItWorksSection; confirmar com coordenação/edital. |

### Curso — 4 pilares — `curso.pillars`

Rota: `/curso` · Código: `CourseSections.tsx (CoursePillarsSection) + staging PILLARS`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `curso.pillars.texto` | narrative | Material Rodante; Via Permanente; Sinalização; Logística — textos de CoursePillars | — | — | UNVERIFIED | — | — | '15.000 toneladas' e '80km/h' são ilustrativos. |

### Curso — fluxograma interativo — `curso.flowchart`

Rota: `/curso` · Código: `src/components/curriculum/CurriculumExplorer.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `curso.flowchart.dados` | curriculum | Fluxograma das matrizes 2025/2016/2012 (dados de src/data/curriculums.ts) | content/curriculum/*.json (PDFs oficiais) | — | UNVERIFIED | — | — | Fluxograma refeito em FLOW-002; dados canônicos com sha256 do PDF. |

### Curso — laboratórios — `curso.labs`

Rota: `/curso` · Código: `CourseSections.tsx (CourseLabs) + staging LABS`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `curso.labs.lista` | narrative | 14 laboratórios: LMSE, LMS, LabDSE, Robótica Avançada, NSO, LaCMa, LDTPav, LABMCI, LASC, IDA Lab, LIFE, Aeolus, LTS, LAV | referencias_ferro/Portfolio_Laboratorios_EFM_UFSC.pdf p.2 (2026) | — | UNVERIFIED | — | — | LABMCI, LASC e IDA Lab sem página no portfólio (14). Confirmar owner e versão do portfólio. |

### Projetos — hub — `projetos.hub`

Rota: `/projetos` · Código: `src/app/(public)/[locale]/projetos/page.tsx + staging FEATURED_PROJECTS`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `projetos.hub.lista` | narrative | Mesma lista de home.projects | — | — | UNVERIFIED | — | — | Hub real chega com PUBLIC-002/PUB-001. |

### Projetos — detalhe — `projetos.detalhe`

Rota: `/projetos/[slug]` · Código: `src/app/(public)/[locale]/projetos/[slug]/page.tsx`

| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |
|---|---|---|---|---|---|---|---|---|
| `projetos.detalhe.resumo` | narrative | Título/categoria/resumo de staging; corpo marcado como pendente | — | — | UNVERIFIED | — | — | Sem equipe, marcos, resultados até aprovação. |

