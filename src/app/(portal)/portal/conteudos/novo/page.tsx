import type { Metadata } from "next";
import { ContentForm } from "@/components/portal/content/ContentForms";
import { getDictionary } from "@/i18n/dictionaries";
import { requireActiveProfile } from "@/lib/portal/context";
import { listFiles, listProjectOptions } from "@/lib/portal/queries/content";

export const metadata: Metadata = { title: "Novo conteúdo" };

export default async function NewContentPage() {
  const dict = getDictionary("pt").portal;
  await requireActiveProfile();
  const [projects, files] = await Promise.all([listProjectOptions(), listFiles()]);
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <h1 className="text-3xl font-black">{dict.content.newTitle}</h1>
      <div className="rounded-xl border border-line bg-surface p-6">
        <ContentForm dict={dict} projects={projects} files={files.map((f) => ({ id: f.id, label: `${f.name} (${dict.files.consents[f.consent]})` }))} cancelHref="/portal/conteudos" />
      </div>
    </div>
  );
}
