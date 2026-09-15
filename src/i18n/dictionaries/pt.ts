/**
 * Catálogo PT (fonte do tipo `Dictionary`). Só strings de interface/metadata.
 * Conteúdo editorial (seções da Home, páginas) continua nos componentes até
 * BASE-002/PUBLIC-001; em EN essas partes exibem `pending`.
 */
export const pt = {
  site: {
    name: "Engenharia Ferroviária e Metroviária — UFSC Joinville",
    description: "Portal do curso de Engenharia Ferroviária e Metroviária da UFSC Campus Joinville.",
    shortName: "Eng. Ferroviária",
    campus: "UFSC Joinville",
  },
  a11y: {
    skipToContent: "Pular para o conteúdo",
    mainNavigation: "Navegação principal",
    openMenu: "Abrir menu",
    closeMenu: "Fechar menu",
    languageSelector: "Idioma",
  },
  nav: {
    about: "Sobre",
    course: "Curso",
    visits: "Visitas",
    events: "Eventos",
    news: "Notícias",
    projects: "Projetos",
    portal: "Portal",
    portalLong: "Portal do Aluno",
    navigationLabel: "Navegação",
    projectLinks: {
      comunicaFerro: "Comunica Ferro",
      cavalosDeFerro: "Cavalos de Ferro",
      ferroLab: "Ferro Lab",
      extension: "Projetos de Extensão",
    },
  },
  locale: {
    pt: "Português",
    en: "English",
    ptShort: "PT",
    enShort: "EN",
  },
  footer: {
    title: "Engenharia Ferroviária",
    campus: "UFSC — Campus Joinville",
    center: "Centro Tecnológico de Joinville (CTJ)",
    portal: "Portal Acadêmico",
    rights: "Todos os direitos reservados.",
  },
  hero: {
    badge: "Portal não oficial",
    title: "Engenharia Ferroviária",
    subtitle: "e Metroviária · UFSC Joinville",
    description:
      "O único curso de Santa Catarina. Formando os engenheiros que vão mover o Brasil com tecnologia e inovação.",
    primaryButton: "Explorar Portal",
    secondaryButton: "Conhecer o Curso",
    scrollHint: "Rolar",
  },
  cta: {
    title: "Pronto para mover o futuro?",
    description: "Acesse o Portal e tenha acesso ao nosso acervo técnico, banco de questões e projetos exclusivos.",
    primary: "Entrar no Portal",
    secondary: "Mais informações",
  },
  pending: {
    title: "Conteúdo em preparação",
    description: "Esta seção ainda não está disponível neste idioma.",
    pageTitle: "Página em preparação",
    pageDescription: "Esta página ainda não está disponível em inglês. O conteúdo está em revisão editorial.",
    viewInOtherLocale: "Ver em português",
  },
  pages: {
    // Descrições copiadas verbatim das páginas atuais (quarentena editorial em BASE-002).
    home: { title: "Início" },
    course: {
      title: "Curso",
      description:
        "Conheça o único curso de Engenharia Ferroviária e Metroviária do Brasil projetado do zero. Matriz curricular interativa, abrangências e CREA Mecânica.",
    },
    about: { title: "Sobre", description: "Conheça mais sobre o portal FerroSite" },
    visits: {
      title: "Visitas Técnicas",
      description:
        "Explore as visitas técnicas do curso de Engenharia Ferroviária da UFSC. Vivência prática nas maiores concessionárias do Brasil.",
    },
    events: {
      title: "Eventos",
      description: "Fique por dentro de todos os eventos, competições e workshops da Engenharia Ferroviária da UFSC.",
    },
    news: {
      title: "Notícias",
      description: "Acompanhe as últimas notícias, projetos e inovações da Engenharia Ferroviária da UFSC.",
    },
    simulators: { title: "Simuladores", description: "Página de Simuladores do portal FerroSite" },
  },
  states: {
    notFoundTitle: "Página não encontrada",
    notFoundDescription: "Não conseguimos localizar o conteúdo que você solicitou.",
    backHome: "Voltar para a página inicial",
    errorTitle: "Algo deu errado!",
    retry: "Tentar novamente",
    loading: "Carregando…",
  },
} as const;

/** Estrutura obrigatória de todo catálogo (valores livres, chaves fixas). */
export type Dictionary = DeepStrings<typeof pt>;

type DeepStrings<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : DeepStrings<T[K]>;
};
