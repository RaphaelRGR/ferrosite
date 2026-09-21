import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileForm, VerifyFileForm } from "@/components/portal/ContentForms";
import { LinkButton } from "@/components/ui/LinkButton";
import { isDriveConfigured } from "@/lib/files/drive";
import { Badge } from "@/components/ui/Badge";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { isOverseer } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";
import { getFile } from "@/lib/portal/content";

export const metadata: Metadata = { title: "Arquivo" };

const H2 = "text-xs font-bold uppercase tracking-[0.2em] text-fg-muted";

/** Arquivo (17): metadados, consentimento/crédito/alt editáveis pelo dono ou overseer; acesso ao original pendente de credencial. */
export default async function FilePage({ params }: PageProps<"/portal/arquivos/[id]">) {
  const { id } = await params;
  const dict = getDictionary("pt").portal;
  const { profile } = await requireActiveProfile();
  const file = await getFile(id);
  if (!file) notFound();
  const f = dict.files;
  const canEdit = isOverseer(profile.global_role) || file.owner_id === profile.id;
  const driveReady = isDriveConfigured() && file.provider === "google_drive";
  const accessible = driveReady && file.status !== "revoked" && file.status !== "archived";
  const isImage = file.mime_type.startsWith("image/");
  return (
    <div className="flex flex-col gap-8">
      <header className="border-b border-line pb-4">
        <Link href="/portal/arquivos" className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {f.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black">{file.name}</h1>
          <Badge tone={file.status === "revoked" ? "danger" : "neutral"}>{f.statuses[file.status]}</Badge>
          <Badge tone={file.consent === "granted" || file.consent === "not_required" ? "success" : "warning"}>{f.consents[file.consent]}</Badge>
        </div>
      </header>
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-xl border border-line bg-surface p-6">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className={H2}>{f.provider}</dt>
              <dd className="mt-1">{f.providers[file.provider]}</dd>
            </div>
            <div>
              <dt className={H2}>{f.externalId}</dt>
              <dd className="mt-1 break-all font-mono text-xs">{file.external_id}</dd>
            </div>
            <div>
              <dt className={H2}>{f.mimeType}</dt>
              <dd className="mt-1">
                {file.mime_type}
                {file.size_bytes !== null && ` · ${file.size_bytes} bytes`}
              </dd>
            </div>
            <div>
              <dt className={H2}>{f.owner}</dt>
              <dd className="mt-1">
                {file.owner?.full_name || file.owner?.email} · {formatDate("pt", new Date(file.created_at), { dateStyle: "short" })}
              </dd>
            </div>
          </dl>
          <div className="mt-6 rounded-lg border border-dashed border-line-strong bg-canvas px-4 py-3 text-sm text-fg-muted">
            <p className="font-bold text-fg">{f.providerAccess}</p>
            {file.provider !== "google_drive" ? (
              <p className="mt-1 break-all">{file.external_id}</p>
            ) : !driveReady ? (
              <p className="mt-1">{f.providerAccessPending}</p>
            ) : (
              <>
                <p className="mt-1">{f.providerAccessReady}</p>
                {accessible && isImage && (
                  // eslint-disable-next-line @next/next/no-img-element -- proxy autenticado, sem otimização externa
                  <img src={`/portal/arquivos/${file.id}/miniatura`} alt={f.thumbnailAlt.replace("{name}", file.name)} className="mt-3 max-h-64 rounded-lg border border-line" />
                )}
                {accessible && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <LinkButton href={`/portal/arquivos/${file.id}/original`} variant="secondary">
                      {f.openOriginal}
                    </LinkButton>
                    <LinkButton href={`/portal/arquivos/${file.id}/original?baixar=1`} variant="secondary">
                      {f.download}
                    </LinkButton>
                  </div>
                )}
                {file.verified_at && (
                  <p className="mt-3 text-xs">
                    {f.verifiedBy}: {formatDate("pt", new Date(file.verified_at), { dateStyle: "short", timeStyle: "short" })}
                    {file.content_hash && ` · md5 ${file.content_hash}`}
                  </p>
                )}
                {canEdit && (
                  <div className="mt-3">
                    <VerifyFileForm dict={dict} file={file} />
                  </div>
                )}
                {file.classification === "public" && <p className="mt-3 text-xs">{f.publicCover}</p>}
              </>
            )}
          </div>
          {canEdit && (
            <div className="mt-6 border-t border-line pt-6">
              <FileForm dict={dict} file={file} cancelHref="/portal/arquivos" />
            </div>
          )}
        </section>
        <aside className="rounded-xl border border-line bg-surface p-5 text-sm">
          <p>
            <span className={H2}>{f.credit}</span>
            <span className="block">{file.credit || dict.common.none}</span>
          </p>
          <p className="mt-3">
            <span className={H2}>{f.altText}</span>
            <span className="block">{file.alt_text || dict.common.none}</span>
          </p>
          <p className="mt-3">
            <span className={H2}>{f.consentNote}</span>
            <span className="block">{file.consent_note || dict.common.none}</span>
          </p>
        </aside>
      </div>
    </div>
  );
}
