/**
 * Coleção de staging (28): conteúdo institucional que as novas telas exibem
 * SOMENTE sob quarentena (BASE-002). Cada bloco cita a origem; nenhum valor é
 * fato confirmado. Substituído pela projeção pública aprovada (PUB-001).
 * Sem valores EN: em inglês essas seções aparecem como pendentes (24).
 */

export interface StagingItem {
  id: string;
  title: string;
  description: string;
  /** rótulo curto (data, local, categoria) */
  meta?: string;
  /** origem no repositório */
  source: string;
}

/** Indicadores da Home — origem: NumbersSection/VisitsStats (sem fonte primária). */
export const INDICATORS: Array<{ id: string; value: string; label: string; source: string }> = [
  { id: "home.numbers.1o", value: "1º", label: "Curso focado em Engenharia Ferroviária no Brasil", source: "NumbersSection" },
  { id: "home.numbers.103bi", value: "R$ 103 bi", label: "Previstos no Novo PAC para obras em ferrovias", source: "NumbersSection" },
  { id: "home.numbers.30000km", value: "+30.000 km", label: "De malha ferroviária em expansão e modernização", source: "NumbersSection" },
  { id: "visitas.stats.48", value: "48+", label: "Visitas técnicas realizadas", source: "VisitsStats" },
];

/** Dados básicos do curso — origem: HowItWorksSection ("20 vagas… integral… 5 anos"). */
export const COURSE_FACTS: Array<{ id: string; value: string; label: string; source: string }> = [
  { id: "home.how.vagas", value: "5 anos", label: "Duração (10 fases)", source: "HowItWorksSection" },
  { id: "home.how.vagas-turno", value: "Integral", label: "Turno, presencial em Joinville (SC)", source: "HowItWorksSection" },
  { id: "home.how.vagas-ingresso", value: "SiSU e Vestibular UFSC", label: "Formas de ingresso", source: "HowItWorksSection" },
  { id: "home.how.vagas-numero", value: "20 vagas", label: "Por semestre", source: "HowItWorksSection" },
];

/** Projetos citados na navegação atual — origem: Navbar (sem cadastro/descrição oficial). */
export const FEATURED_PROJECTS: StagingItem[] = [
  { id: "comunica-ferro", title: "Comunica Ferro", description: "Projeto de comunicação que dá voz às ferrovias e conecta alunos ao setor.", meta: "Comunicação", source: "Navbar/StoryJourney/HowItWorksSection" },
  { id: "cavalos-de-ferro", title: "Cavalos de Ferro", description: "Competição estudantil de engenharia ferroviária.", meta: "Competição", source: "Navbar/EventsSection" },
  { id: "ferro-lab", title: "Ferro Lab", description: "Laboratório operando de dentro de um container real, para atividades práticas.", meta: "Extensão", source: "Navbar/StoryJourney" },
  { id: "extensao", title: "Projetos de Extensão", description: "[CONTEÚDO PENDENTE]", meta: "Extensão", source: "Navbar" },
];

/** Experiências (visitas/missões) — origem: VisitsSection, VisitsGallery, VisitsSchedule. */
export const EXPERIENCES: Array<StagingItem & { scope: "brasil" | "internacional"; when: string }> = [
  { id: "visitas.gallery.vale-2022", title: "Vale — EFVM", description: "Estrada de Ferro Vitória a Minas: operação de minério e trem de passageiros.", meta: "Vitória (ES)", when: "2022", scope: "brasil", source: "VisitsGallery" },
  { id: "visitas.gallery.rumo-2023", title: "CCO Rumo Logística", description: "Centro de Controle Operacional da malha sul e central.", meta: "Curitiba (PR)", when: "2023", scope: "brasil", source: "VisitsGallery" },
  { id: "visitas.gallery.mrs-2024", title: "Oficinas da MRS", description: "Manutenção pesada de locomotivas e vagões.", meta: "Jundiaí (SP)", when: "2024", scope: "brasil", source: "VisitsGallery" },
  { id: "visitas.schedule.rumo", title: "RUMO Logística", description: "Visita ao CCO e oficinas em Curitiba.", meta: "Curitiba (PR)", when: "18 jun 2026", scope: "brasil", source: "VisitsSchedule" },
  { id: "visitas.schedule.utn", title: "UTN — Buenos Aires", description: "Missão internacional: rede metroviária argentina e intercâmbio acadêmico.", meta: "Buenos Aires (ARG)", when: "jul 2026", scope: "internacional", source: "VisitsSchedule" },
  { id: "visitas.schedule.vli", title: "VLI Logística", description: "Terminal Integrador Portuário em Santos.", meta: "Santos (SP)", when: "set 2026", scope: "brasil", source: "VisitsSchedule" },
];

/** Notícias — origem: NewsFeatured/NewsGrid (sem fonte; possivelmente fictícias). */
export const NEWS: StagingItem[] = [
  { id: "noticias.featured.hidrogenio", title: "UFSC Joinville lidera pesquisa sobre hidrogênio verde em trens", description: "Projeto que visa substituir motores diesel por células de combustível a hidrogênio.", meta: "12 mai 2026", source: "NewsFeatured" },
  { id: "noticias.grid.08mai", title: "Novos laboratórios de sinalização são inaugurados no CTJ", description: "Estrutura com simuladores para treinamento de sistemas de controle.", meta: "08 mai 2026", source: "NewsGrid" },
  { id: "noticias.grid.28abr", title: "Alunos desenvolvem sensor IoT para monitoramento de trilhos", description: "Solução de baixo custo para identificar fissuras precocemente.", meta: "28 abr 2026", source: "NewsGrid" },
];

/** Logos — origem: public/empresas (autorização de marca pendente). */
export const PARTNER_LOGOS: Array<{ id: string; name: string; src: string }> = [
  { id: "rumo", name: "Rumo Logística", src: "/empresas/rumo.png" },
  { id: "mrs", name: "MRS Logística", src: "/empresas/mrs.png" },
  { id: "vli", name: "VLI", src: "/empresas/vli.png" },
  { id: "vale", name: "Vale", src: "/empresas/vale.png" },
  { id: "anptrilhos", name: "ANPTrilhos", src: "/empresas/anptrilhos.png" },
  { id: "ftc", name: "FTC", src: "/empresas/ftc.png" },
  { id: "lanfranco", name: "Lanfranco", src: "/empresas/lanfranco.png" },
];

/** Pilares — origem: CoursePillars (copy editorial; '15.000 toneladas' e '80km/h' são ilustrativos). */
export const PILLARS: StagingItem[] = [
  { id: "mecanica", title: "Material Rodante", meta: "A Força Motriz", description: "Projetamos o coração das ferrovias. De truques superestruturados a locomotivas diesel-elétricas que tracionam 15.000 toneladas, tudo passa pela engenharia mecânica pesada.", source: "CoursePillars" },
  { id: "infra", title: "Via Permanente", meta: "A Base Operacional", description: "A infraestrutura perfeita é invisível até falhar. Estudamos a geotecnia, o dimensionamento de trilhos, lastros e dormentes para suportar o impacto implacável do transporte em massa.", source: "CoursePillars" },
  { id: "controle", title: "Sinalização", meta: "O Cérebro da Malha", description: "Como evitar que dois trens de carga colidam a 80km/h? Desenvolvemos os sistemas embarcados e telecomunicações (PTC, CBTC) que garantem a segurança ativa da via.", source: "CoursePillars" },
  { id: "logistica", title: "Logística", meta: "A Eficiência Total", description: "Ferrovia é o negócio de mover volumes gigantescos pelo menor custo. Aprendemos a otimizar rotas, consumo de combustível e a economia complexa por trás do frete nacional.", source: "CoursePillars" },
];

/** Texto "sobre o curso" — origem: AboutSection (alegação 'referência técnica' sem fonte). */
export const ABOUT_COURSE_TEXT = {
  id: "home.about.narrativa",
  text: "Formamos profissionais para projetar, construir e operar os sistemas que são a espinha dorsal da logística nacional. O curso de Engenharia Ferroviária e Metroviária da UFSC Joinville é referência técnica e inovação no setor.",
  source: "AboutSection",
};

/** Linha do tempo — origem: StoryJourney. Nomes de pessoas removidos (dado pessoal sem consentimento). */
export const HISTORY: Array<StagingItem & { when: string }> = [
  { id: "sobre.story.2009", when: "2009", title: "Criação do curso", description: "Criado através do programa REUNI, o curso inicia suas atividades na inauguração do campus de Joinville da UFSC.", source: "StoryJourney" },
  { id: "sobre.story.2013", when: "2013 / 2014", title: "Primeira turma formada", description: "A formatura da primeira turma é um marco histórico para o curso e para o setor.", source: "StoryJourney (sem o nome da pessoa citada)" },
  { id: "sobre.story.2023", when: "2023", title: "Premiação científica", description: "Projetos de pesquisa do curso ganham destaque nacional, com premiação de melhor trabalho em encontro científico.", source: "StoryJourney" },
  { id: "sobre.story.2024", when: "2024", title: "Reconhecimento do setor", description: "Indicação como Melhor Instituição de Ensino no Prêmio Revista Ferroviária e Prêmio Inovação da ANTT para egressos.", source: "StoryJourney" },
];

/** Missão, visão e valores — origem: AboutIdentity (não localizados em documento oficial). */
export const IDENTITY: StagingItem[] = [
  { id: "sobre.identity.missao", title: "Missão", meta: "Por que existimos?", description: "Não fomos criados apenas para diplomar engenheiros. Existimos para preencher um vazio histórico na logística nacional. Nossa missão é formar a elite técnica capaz de liderar o renascimento das ferrovias no Brasil, projetando e operando sistemas que movem a riqueza do país com segurança e eficiência máxima.", source: "AboutIdentity" },
  { id: "sobre.identity.visao", title: "Visão", meta: "Onde queremos chegar?", description: "Ser o epicentro da inovação metroferroviária na América Latina. Queremos que cada quilômetro de novo trilho implantado no continente tenha a assinatura, a pesquisa ou a gestão de um profissional moldado no CTJ.", source: "AboutIdentity" },
  { id: "sobre.identity.valores", title: "Valores", meta: "O que nos move?", description: "Rigor técnico inegociável, segurança operacional absoluta, sustentabilidade sistêmica e coragem para inovar em um setor tradicional.", source: "AboutIdentity" },
];

/** Linhas de pesquisa — origem: AboutResearch (confrontar com os laboratórios do portfólio). */
export const RESEARCH_LINES: StagingItem[] = [
  { id: "sobre.research.dinamica", title: "Dinâmica Ferroviária e Roda-Trilho", description: "Física do contato roda-trilho: fadiga, desgaste, descarrilamento e otimização de truques.", source: "AboutResearch" },
  { id: "sobre.research.logistica", title: "Logística e Otimização de Malhas", description: "Cruzamentos, pátios e escoamento: modelos para aumentar capacidade e reduzir gargalos.", source: "AboutResearch" },
  { id: "sobre.research.via", title: "Via Permanente e Infraestrutura", description: "Dormentes, lastros, sublastros e geotecnia ferroviária.", source: "AboutResearch" },
  { id: "sobre.research.sinalizacao", title: "Sinalização e Controle de Tráfego", description: "Do PTC ao CBTC: telecomunicações e controle de tráfego ferroviário e metroviário.", source: "AboutResearch" },
];
