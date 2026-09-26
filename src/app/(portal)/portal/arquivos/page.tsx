import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate, formatNumber } from "@/i18n/format";
import { isOverseer } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";
import { listFiles } from "@/lib/portal/queries/content";

export const metadata: Metadata = { title: "Arquivos" };

/** Acervo (17): metadados dos arquivos que o usuário pode ver (dono, vínculo ou overseer). */
export default async function FilesPage() {
  const dict = getDictionary("pt").portal;
  const { profile } = await requireActiveProfile();
  const files = await listFiles();
  const f = dict.files;
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">{f.title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-fg-muted">{f.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/portal/arquivos/enviar">{f.upload.title}</LinkButton>
          {isOverseer(profile.global_role) && <LinkButton href="/portal/arquivos/importar" variant="secondary">{f.importer.title}</LinkButton>}
          <LinkButton href="/portal/arquivos/novo" variant="secondary">{f.new}</LinkButton>
        </div>
      </header>
      {files.length === 0 ? (
        <EmptyState title={f.empty} description="" />
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
          {files.map((x) => (
            <li key={x.id}>
              <Link href={`/portal/arquivos/${x.id}`} className="flex flex-col gap-1 p-4 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0">
                  {/* nomes de arquivo são longos e sem espaços: precisam quebrar */}
                  <span className="block font-bold break-words">{x.name}</span>
                  <span className="block text-sm text-fg-muted">
                    {f.providers[x.provider]} · {x.mime_type}
                    {x.size_bytes !== null && ` · ${formatNumber("pt", Math.round(x.size_bytes / 1024))} KB`} · {x.owner?.full_name || x.owner?.email} · {formatDate("pt", new Date(x.created_at), { dateStyle: "short" })}
                  </span>
                </span>
                <span className="flex flex-wrap gap-2">
                  <Badge tone={x.consent === "granted" || x.consent === "not_required" ? "success" : x.consent === "refused" ? "danger" : "warning"}>{f.consents[x.consent]}</Badge>
                  <Badge tone={x.status === "revoked" ? "danger" : x.status === "verified" ? "success" : "neutral"}>{f.statuses[x.status]}</Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
