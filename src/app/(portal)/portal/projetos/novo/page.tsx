import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/portal/projects/ProjectForm";
import { getDictionary } from "@/i18n/dictionaries";
import { canCreateProject } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";

export const metadata: Metadata = { title: "Novo projeto" };

/** Criação de projeto: admin, coordenação e orientador (11). Sem papel, 404 (rota não existe para o usuário). */
export default async function NewProjectPage() {
  const dict = getDictionary("pt").portal;
  const { profile } = await requireActiveProfile();
  if (!canCreateProject(profile.global_role)) notFound();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <h1 className="text-3xl font-black">{dict.projects.newTitle}</h1>
      <div className="rounded-xl border border-line bg-surface p-6">
        <ProjectForm dict={dict} cancelHref="/portal/projetos" />
      </div>
    </div>
  );
}
