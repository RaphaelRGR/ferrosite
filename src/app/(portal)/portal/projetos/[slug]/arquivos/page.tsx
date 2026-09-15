import type { Metadata } from "next";
import Link from "next/link";
import { LinkFileForm, UnlinkFileForm } from "@/components/portal/ContentForms";
import { ProjectHeader } from "@/components/portal/ProjectHeader";
import { Badge } from "@/components/ui/Badge";
import { getDictionary } from "@/i18n/dictionaries";
import { canManageProject } from "@/lib/portal/authz";
import { loadProject } from "@/lib/portal/context";
import { listFiles, listProjectFiles } from "@/lib/portal/content";

export const metadata: Metadata = { title: "Arquivos do projeto" };

/** Arquivos vinculados ao projeto (17): capa única, galeria, anexos e documentos oficiais; vincular/desvincular. */
export default async function ProjectFilesPage({ params }: PageProps<"/portal/projetos/[slug]/arquivos">) {
  const { slug } = await params;
  const dict = getDictionary("pt").portal;
  const { project, actor } = await loadProject(slug);
  const [links, files] = await Promise.all([listProjectFiles(project.id), listFiles()]);
  const f = dict.files;
  const linkedIds = new Set(links.map((l) => l.file_id));
  const candidates = files.filter((x) => !linkedIds.has(x.id) && x.status !== "revoked").map((x) => ({ id: x.id, label: `${x.name} (${f.consents[x.consent]})` }));
  const canLink = !!actor.projectRole || canManageProject(actor);
  return (
    <div className="flex flex-col gap-8">
      <ProjectHeader project={project} actor={actor} dict={dict} tab="files" />
      <section className="rounded-xl border border-line bg-surface p-6">
        <h2 className="text-lg font-bold">{f.projectFiles}</h2>
        {links.length === 0 ? (
          <p className="mt-2 text-sm text-fg-muted">{f.noProjectFiles}</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-line">
            {links.map((l) => (
              <li key={l.file_id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span>
                  <Badge tone={l.kind === "cover" ? "info" : "neutral"}>{f.kinds[l.kind]}</Badge>{" "}
                  {l.file ? (
                    <Link href={`/portal/arquivos/${l.file.id}`} className="font-bold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                      {l.file.name}
                    </Link>
                  ) : (
                    <span className="text-fg-muted">{dict.common.none}</span>
                  )}
                  {l.file && <span className="text-fg-muted"> · {f.consents[l.file.consent]}</span>}
                </span>
                {canManageProject(actor) && <UnlinkFileForm dict={dict} projectId={project.id} slug={project.slug} fileId={l.file_id} />}
              </li>
            ))}
          </ul>
        )}
        {canLink && (
          <div className="mt-5 border-t border-line pt-5">
            <LinkFileForm dict={dict} projectId={project.id} slug={project.slug} candidates={candidates} />
          </div>
        )}
      </section>
    </div>
  );
}
