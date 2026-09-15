import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/portal/ProjectForm";
import { ProjectHeader } from "@/components/portal/ProjectHeader";
import { getDictionary } from "@/i18n/dictionaries";
import { canManageProject } from "@/lib/portal/authz";
import { loadProject } from "@/lib/portal/context";

export const metadata: Metadata = { title: "Editar projeto" };

/** Edição: overseer ou líder (RLS project_update). Formulário carrega `version` para concorrência. */
export default async function EditProjectPage({ params }: PageProps<"/portal/projetos/[slug]/editar">) {
  const { slug } = await params;
  const dict = getDictionary("pt").portal;
  const { project, actor } = await loadProject(slug);
  if (!canManageProject(actor)) notFound();
  return (
    <div className="flex flex-col gap-8">
      <ProjectHeader project={project} actor={actor} dict={dict} tab="overview" />
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-line bg-surface p-6">
        <h2 className="mb-5 text-lg font-bold">{dict.projects.editTitle}</h2>
        <ProjectForm dict={dict} project={project} cancelHref={`/portal/projetos/${project.slug}`} />
      </div>
    </div>
  );
}
