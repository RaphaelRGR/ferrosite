import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExperienceForm } from "@/components/portal/experiences/ExperienceForm";
import { PhotoGrid } from "@/components/portal/experiences/PhotoGrid";
import { PhotoImporter } from "@/components/portal/experiences/PhotoImporter";
import { PublishBar } from "@/components/portal/experiences/PublishBar";
import { LinkButton } from "@/components/ui/LinkButton";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { renderMarkdown } from "@/lib/content/markdown";
import { isOverseer } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";
import { listProjectOptions } from "@/lib/portal/queries/content";
import { getExperience } from "@/lib/portal/queries/experiences";

export const metadata: Metadata = { title: "Experiência" };

/**
 * Uma experiência (EXP-001): situação no site e publicar, dados, importação da pasta do Drive e a
 * grade de fotos (capa, ocultar, descrição). `?editar=1` abre os dados; `?importar=1` importa logo.
 */
export default async function ExperiencePage({ params, searchParams }: PageProps<"/portal/experiencias/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const dict = getDictionary("pt").portal;
  const { profile } = await requireActiveProfile();
  if (!isOverseer(profile.global_role)) notFound();
  const editing = sp.editar === "1";
  const [found, projects] = await Promise.all([getExperience(id), editing ? listProjectOptions() : Promise.resolve([])]);
  if (!found) notFound();
  const { item, photos, site } = found;
  const e = dict.experiences;
  const shown = photos.filter((p) => p.shown).length;

  return (
    <div className="flex flex-col gap-8">
      <header className="border-b border-line pb-4">
        <Link href="/portal/experiencias" className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {e.back}
        </Link>
        <h1 className="mt-1 text-3xl font-black">{item.title}</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {item.event_at ? formatDate("pt", new Date(item.event_at), { dateStyle: "long" }) : ""}
          {item.event_place ? ` · ${item.event_place}` : ""} · {e.photosCount.replace("{count}", String(shown))}
        </p>
      </header>

      <PublishBar dict={dict} itemId={item.id} site={site} publicHref={`/pt/experiencias/${item.slug}`} hasCover={Boolean(item.cover_file_id)} />

      <section className="rounded-xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{editing ? e.formTitleEdit : e.summary}</h2>
          {!editing && (
            <LinkButton href={`/portal/experiencias/${item.id}?editar=1`} variant="secondary" size="sm">
              {dict.common.edit}
            </LinkButton>
          )}
        </div>
        {editing ? (
          <div className="mt-5">
            <ExperienceForm dict={dict} projects={projects} item={item} cancelHref={`/portal/experiencias/${item.id}`} />
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm">{item.summary || dict.common.none}</p>
            {item.body_md && <div className="prose-content mt-4 text-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(item.body_md) }} />}
          </>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6">
        <div>
          <h2 className="text-lg font-bold">{e.photos}</h2>
          <p className="mt-1 text-sm text-fg-muted">{e.photosHelp}</p>
        </div>
        <PhotoImporter dict={dict} itemId={item.id} hasFolder={Boolean(item.photo_folder_id)} hasPhotos={photos.length > 0} autoStart={sp.importar === "1"} />
        <PhotoGrid dict={dict} itemId={item.id} photos={photos} coverId={item.cover_file_id} />
      </section>
    </div>
  );
}
