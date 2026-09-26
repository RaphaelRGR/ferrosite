import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MissionForm } from "@/components/portal/projects/MissionForms";
import { ProjectHeader } from "@/components/portal/projects/ProjectHeader";
import { getDictionary } from "@/i18n/dictionaries";
import { canCreateMission } from "@/lib/portal/authz";
import { loadProject } from "@/lib/portal/context";

export const metadata: Metadata = { title: "Nova missão" };

/** Criação de missão: líder/membro do projeto ou overseer (RLS mission_insert). */
export default async function NewMissionPage({ params }: PageProps<"/portal/projetos/[slug]/missoes/nova">) {
  const { slug } = await params;
  const dict = getDictionary("pt").portal;
  const { project, actor } = await loadProject(slug);
  if (!canCreateMission(actor)) notFound();
  return (
    <div className="flex flex-col gap-8">
      <ProjectHeader project={project} actor={actor} dict={dict} tab="missions" />
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-line bg-surface p-6">
        <h2 className="mb-5 text-lg font-bold">{dict.missions.newTitle}</h2>
        <MissionForm dict={dict} projectId={project.id} slug={project.slug} cancelHref={`/portal/projetos/${project.slug}/missoes`} />
      </div>
    </div>
  );
}
