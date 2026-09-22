import type { Metadata } from "next";
import Link from "next/link";
import { UploadForm } from "@/components/portal/UploadForm";
import { getDictionary } from "@/i18n/dictionaries";
import { getDriveClient } from "@/lib/files/drive-connection";
import { isOverseer } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";
import { listUploadableTypes, listUploadTargets } from "@/lib/portal/content";

export const metadata: Metadata = { title: "Enviar arquivo" };

/**
 * Enviar arquivo ao Drive (DRIVE-003): destinos vêm do RLS (projetos em que a
 * pessoa participa; áreas institucionais só para coordenação). Sem conexão
 * com escrita, o formulário explica em vez de falhar no envio.
 */
export default async function UploadPage({ searchParams }: PageProps<"/portal/arquivos/enviar">) {
  const dict = getDictionary("pt").portal;
  const { profile } = await requireActiveProfile();
  const sp = await searchParams;
  const initialProject = typeof sp.projeto === "string" ? sp.projeto : undefined;
  const missionId = typeof sp.missao === "string" && /^[0-9a-f-]{36}$/.test(sp.missao) ? sp.missao : undefined;
  const contentId = typeof sp.conteudo === "string" && /^[0-9a-f-]{36}$/.test(sp.conteudo) ? sp.conteudo : undefined;
  const overseer = isOverseer(profile.global_role);
  const [projects, types, conn] = await Promise.all([listUploadTargets(profile.id, overseer), listUploadableTypes(), getDriveClient()]);
  const f = dict.files;
  return (
    <div className="flex flex-col gap-8">
      <header className="border-b border-line pb-4">
        <Link href="/portal/arquivos" className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {f.title}
        </Link>
        <h1 className="mt-1 text-3xl font-black">{f.upload.title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-fg-muted">{f.upload.description}</p>
      </header>
      <section className="rounded-xl border border-line bg-surface p-6">
        {projects.length === 0 && !overseer && !contentId ? (
          <p role="status" className="text-sm text-fg-muted">{f.upload.noProjects}</p>
        ) : (
          <UploadForm dict={dict} projects={projects} overseer={overseer} initialProject={initialProject} missionId={missionId} contentId={contentId} canWrite={Boolean(conn?.canWrite && conn.rootFolderId)} accept={types} />
        )}
      </section>
    </div>
  );
}
