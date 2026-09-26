import type { Metadata } from "next";
import { FileForm } from "@/components/portal/files/FileForms";
import { getDictionary } from "@/i18n/dictionaries";
import { requireActiveProfile } from "@/lib/portal/context";

export const metadata: Metadata = { title: "Registrar arquivo" };

export default async function NewFilePage() {
  const dict = getDictionary("pt").portal;
  await requireActiveProfile();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <h1 className="text-3xl font-black">{dict.files.new}</h1>
      <p className="text-sm text-fg-muted">{dict.files.description}</p>
      <div className="rounded-xl border border-line bg-surface p-6">
        <FileForm dict={dict} cancelHref="/portal/arquivos" />
      </div>
    </div>
  );
}
