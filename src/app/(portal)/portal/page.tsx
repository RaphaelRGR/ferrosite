import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Início" };

/**
 * Início do Portal. Sem indicadores fictícios: os widgets por perfil (05)
 * entram quando existirem dados canônicos de projetos/missões.
 */
export default async function PortalDashboardPage() {
  const dict = getDictionary("pt").portal;
  const session = await getCurrentSession();
  const name = session?.profile?.full_name || session?.user.email || "";
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">{dict.dashboard.title}</p>
        <h1 className="mt-1 text-3xl font-black">
          {dict.dashboard.greeting}
          {name ? `, ${name}` : ""}
        </h1>
      </header>
      <EmptyState
        title={dict.dashboard.emptyTitle}
        description={dict.dashboard.emptyDescription}
        action={
          <LinkButton href="/portal/projetos" variant="secondary">
            {dict.dashboard.goToProjects}
          </LinkButton>
        }
      />
    </div>
  );
}
