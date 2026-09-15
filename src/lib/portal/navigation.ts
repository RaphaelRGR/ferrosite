import type { Dictionary } from "@/i18n/dictionaries";
import type { CurrentProfile, GlobalRole } from "@/lib/auth/session";

export interface NavItem {
  href: string;
  label: string;
  /** Papéis globais que enxergam o item; vazio = qualquer conta ativa. */
  requires?: GlobalRole[];
  /** Ícone simples (path SVG 24x24, stroke). */
  icon: string;
}

const ICONS = {
  dashboard: "M3 11.5 12 4l9 7.5M5 10v10h5v-6h4v6h5V10",
  projects: "M3 7h6l2 2h10v11H3z",
  people: "M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm-12 9a8 8 0 0 1 16 0",
  organizations: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5",
  challenges: "M12 3v4m0 10v4M3 12h4m10 0h4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
  content: "M6 3h9l5 5v13H6zM14 3v6h6M9 13h6M9 17h6",
  files: "M4 5h6l2 2h8v12H4zM4 9h16",
  reports: "M4 20h16M6 16l4-5 4 3 5-7M6 20v-4M11 20v-8M16 20v-6M21 20V9",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1l2-1.5-2-3.4-2.3.9a7.5 7.5 0 0 0-1.7-1L15 3.5H9l-.3 2.5a7.5 7.5 0 0 0-1.7 1L4.7 6.1l-2 3.4 2 1.5a7.4 7.4 0 0 0 0 2l-2 1.5 2 3.4 2.3-.9a7.5 7.5 0 0 0 1.7 1L9 20.5h6l.3-2.5a7.5 7.5 0 0 0 1.7-1l2.3.9 2-3.4-2-1.5c.1-.3.1-.7.1-1Z",
} as const;

/**
 * Itens de navegação do Portal. Só rotas que existem e têm função entram aqui
 * (03: página inexistente não aparece na navegação). Missões vivem dentro do
 * projeto; Arquivos, Relatórios etc. entram quando suas fatias forem entregues.
 */
export function portalNavItems(dict: Dictionary["portal"]): NavItem[] {
  return [
    { href: "/portal", label: dict.nav.dashboard, icon: ICONS.dashboard },
    { href: "/portal/projetos", label: dict.nav.projects, icon: ICONS.projects },
    { href: "/portal/pessoas", label: dict.nav.people, icon: ICONS.people, requires: ["admin", "coordination"] },
    { href: "/portal/empresas", label: dict.nav.organizations, icon: ICONS.organizations, requires: ["admin", "coordination"] },
    { href: "/portal/desafios", label: dict.nav.challenges, icon: ICONS.challenges, requires: ["admin", "coordination", "advisor"] },
    { href: "/portal/conteudos", label: dict.nav.content, icon: ICONS.content },
    { href: "/portal/arquivos", label: dict.nav.files, icon: ICONS.files },
    { href: "/portal/relatorios", label: dict.nav.reports, icon: ICONS.reports, requires: ["admin", "coordination"] },
    { href: "/portal/configuracoes", label: dict.nav.settings, icon: ICONS.settings },
  ];
}

export function visibleNavItems(items: NavItem[], profile: Pick<CurrentProfile, "global_role"> | null): NavItem[] {
  return items.filter((item) => !item.requires?.length || (profile && item.requires.includes(profile.global_role)));
}

export function isActivePath(pathname: string, href: string): boolean {
  return href === "/portal" ? pathname === "/portal" : pathname === href || pathname.startsWith(`${href}/`);
}
