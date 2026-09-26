import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Actor, ProjectStatus } from "@/lib/portal/authz";
import { isOverseer } from "@/lib/portal/authz";
import type { ProjectRow } from "@/lib/portal/queries/projects";

export const PROJECT_STATUS_TONE: Record<ProjectStatus, BadgeTone> = {
  draft: "neutral",
  planned: "info",
  active: "success",
  paused: "warning",
  completed: "success",
  archived: "neutral",
  cancelled: "danger",
};

export type ProjectTab = "overview" | "team" | "missions" | "files";

/** Cabeçalho comum das páginas de um projeto: nome, situação, papel do usuário e abas (links). */
export function ProjectHeader({ project, actor, dict, tab }: { project: ProjectRow; actor: Actor; dict: Dictionary["portal"]; tab: ProjectTab }) {
  const base = `/portal/projetos/${project.slug}`;
  const tabs: Array<{ id: ProjectTab; href: string; label: string }> = [
    { id: "overview", href: base, label: dict.projects.overview },
    { id: "team", href: `${base}/equipe`, label: dict.projects.team },
    { id: "missions", href: `${base}/missoes`, label: dict.projects.missions },
    { id: "files", href: `${base}/arquivos`, label: dict.projects.files },
  ];
  const roleLabel = actor.projectRole ? dict.projectRoles[actor.projectRole] : isOverseer(actor.globalRole) ? dict.projects.overseer : dict.common.none;
  return (
    <header className="flex flex-col gap-4 border-b border-line pb-4">
      <div>
        <Link href="/portal/projetos" className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {dict.projects.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black">{project.name}</h1>
          <Badge tone={PROJECT_STATUS_TONE[project.status]}>{dict.projectStatus[project.status]}</Badge>
        </div>
        <p className="mt-1 text-sm text-fg-muted">
          {dict.projects.yourRole}: <span className="font-bold text-fg">{roleLabel}</span>
        </p>
      </div>
      <nav aria-label={project.name} className="flex flex-wrap gap-1">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            aria-current={t.id === tab ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
              t.id === tab ? "bg-action text-fg-on-action" : "text-fg-muted hover:bg-surface-2 hover:text-fg"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
