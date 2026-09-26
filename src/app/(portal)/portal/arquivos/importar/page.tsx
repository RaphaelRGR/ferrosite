import type { Metadata } from "next";
import Link from "next/link";
import { ImportForm } from "@/components/portal/files/ImportForm";
import { getDictionary } from "@/i18n/dictionaries";
import { getDriveClient } from "@/lib/files/drive-connection";
import { isOverseer } from "@/lib/portal/authz";
import { listContent, listUploadTargets } from "@/lib/portal/queries/content";
import { requireActiveProfile } from "@/lib/portal/context";

export const metadata: Metadata = { title: "Importar do Drive" };

/** Importar pasta do Drive humano para o acervo (DRIVE-004): só admin/coordenação; exige conexão com escrita. */
export default async function ImportPage() {
  const dict = getDictionary("pt").portal;
  const { profile } = await requireActiveProfile();
  const overseer = isOverseer(profile.global_role);
  const f = dict.files;
  const [projects, contents, conn] = overseer ? await Promise.all([listUploadTargets(profile.id, true), listContent({}), getDriveClient()]) : [[], [], null];
  return (
    <div className="flex flex-col gap-8">
      <header className="border-b border-line pb-4">
        <Link href="/portal/arquivos" className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {f.title}
        </Link>
        <h1 className="mt-1 text-3xl font-black">{f.importer.title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-fg-muted">{f.importer.description}</p>
      </header>
      <section className="rounded-xl border border-line bg-surface p-6">
        {!overseer ? (
          <p role="status" className="text-sm text-fg-muted">{dict.integrations.forbidden}</p>
        ) : !conn?.canWrite || !conn.rootFolderId ? (
          <p role="alert" className="rounded-lg border border-warning bg-surface px-4 py-3 text-sm font-bold text-warning">{f.upload.noWriteScope}</p>
        ) : (
          <ImportForm dict={dict} projects={projects} contents={contents.filter((c) => ["draft", "changes_requested", "review"].includes(c.status) || overseer).map((c) => ({ id: c.id, label: `${dict.content.types[c.type]} · ${c.title} (${c.locale.toUpperCase()})` }))} />
        )}
      </section>
    </div>
  );
}
