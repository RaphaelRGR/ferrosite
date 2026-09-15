import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDictionary } from "@/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Projetos" };

/**
 * Lista de projetos visíveis ao usuário (RLS decide). CRUD chega em PORTAL-002.
 */
export default async function PortalProjectsPage() {
  const dict = getDictionary("pt").portal;
  const supabase = await createClient();
  const { data, error } = await supabase.from("project").select("id, slug, name, status").order("name");
  const projects = (data ?? []) as Array<{ id: string; slug: string; name: string; status: string }>;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-black">{dict.projects.title}</h1>
      {error || projects.length === 0 ? (
        <EmptyState title={dict.projects.emptyTitle} description={dict.projects.emptyDescription} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <li key={p.id} className="rounded-xl border border-line bg-surface p-5">
              <p className="text-lg font-bold">{p.name}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-fg-muted">{p.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
