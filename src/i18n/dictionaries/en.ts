import type { Dictionary } from "./pt";

/**
 * Catálogo EN. O tipo `Dictionary` obriga cobertura de todas as chaves de PT.
 * Tradução humana das strings de interface; nomes oficiais e siglas não são
 * traduzidos (24). Alegações institucionais (ex.: hero) espelham o PT e estão
 * em quarentena editorial (BASE-002).
 */
export const en: Dictionary = {
  site: {
    name: "Railway and Metro Engineering — UFSC Joinville",
    description: "Website of the Railway and Metro Engineering program at UFSC, Joinville campus.",
    shortName: "Railway Eng.",
    campus: "UFSC Joinville",
  },
  a11y: {
    skipToContent: "Skip to content",
    mainNavigation: "Main navigation",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    languageSelector: "Language",
  },
  nav: {
    about: "About",
    course: "Program",
    visits: "Field Visits",
    events: "Events",
    news: "News",
    projects: "Projects",
    portal: "Portal",
    portalLong: "Student Portal",
    navigationLabel: "Navigation",
    projectLinks: {
      comunicaFerro: "Comunica Ferro",
      cavalosDeFerro: "Cavalos de Ferro",
      ferroLab: "Ferro Lab",
      extension: "Outreach Projects",
    },
  },
  locale: {
    pt: "Português",
    en: "English",
    ptShort: "PT",
    enShort: "EN",
  },
  footer: {
    title: "Railway Engineering",
    campus: "UFSC — Joinville Campus",
    center: "Joinville Technological Center (CTJ)",
    portal: "Academic Portal",
    rights: "All rights reserved.",
  },
  hero: {
    badge: "Unofficial website",
    title: "Railway Engineering",
    subtitle: "and Metro Engineering · UFSC Joinville",
    description:
      "The only program of its kind in Santa Catarina. Educating the engineers who will move Brazil with technology and innovation.",
    primaryButton: "Explore the Portal",
    secondaryButton: "About the Program",
    scrollHint: "Scroll",
  },
  cta: {
    title: "Ready to move the future?",
    description: "Access the Portal to reach our technical library, question bank and exclusive projects.",
    primary: "Enter the Portal",
    secondary: "Learn more",
  },
  pending: {
    title: "Content in preparation",
    description: "This section is not available in this language yet.",
    pageTitle: "Page in preparation",
    pageDescription: "This page is not available in English yet. The content is under editorial review.",
    viewInOtherLocale: "View in Portuguese",
  },
  pages: {
    home: { title: "Home" },
    course: {
      title: "Program",
      description:
        "Learn about the Railway and Metro Engineering program at UFSC Joinville: interactive curriculum, scope and professional accreditation.",
    },
    about: { title: "About", description: "Learn more about the Railway and Metro Engineering program at UFSC Joinville." },
    visits: {
      title: "Field Visits",
      description: "Explore the technical field visits of the Railway Engineering program at UFSC.",
    },
    events: {
      title: "Events",
      description: "Events, competitions and workshops of Railway Engineering at UFSC.",
    },
    news: {
      title: "News",
      description: "News, projects and innovations from Railway Engineering at UFSC.",
    },
    simulators: { title: "Simulators", description: "Simulators of the Railway Engineering program at UFSC." },
  },
  states: {
    notFoundTitle: "Page not found",
    notFoundDescription: "We could not find the content you requested.",
    backHome: "Back to the home page",
    errorTitle: "Something went wrong!",
    retry: "Try again",
    loading: "Loading…",
  },
};
