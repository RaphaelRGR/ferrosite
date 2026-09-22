import { isDriveAvailable } from "@/lib/files/drive-availability";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Locale } from "@/i18n/config";
import { createPublicClient } from "@/lib/supabase/public";
import type { Database } from "@/types/database";

/**
 * Leitura da projeção pública (PUB-001). Nunca consulta tabelas internas: só a
 * view `public_publication`, que já filtra despublicados e agendados futuros.
 * Falha de rede/config ⇒ lista vazia (o site mostra estado vazio/staging), nunca erro.
 */
export type ContentType = Database["public"]["Enums"]["content_type"];
export interface PublishedItem {
  id: string;
  type: ContentType;
  locale: Locale;
  slug: string;
  title: string;
  summary: string;
  body_md: string;
  event_at: string | null;
  event_place: string;
  cover_alt: string;
  cover_credit: string;
  published_at: string;
  cover_file_id: string | null;
  gallery_file_ids: string[];
}

export interface PublicGalleryItem {
  fileId: string;
  alt: string;
  credit: string;
  caption: string;
}

const FIELDS = "id, type, locale, slug, title, summary, body_md, event_at, event_place, cover_alt, cover_credit, published_at, cover_file_id, gallery_file_ids";

export interface PublicProject {
  id: string;
  slug: string;
  name: string;
  name_en: string;
  summary: string;
  summary_en: string;
  description_md: string;
  description_md_en: string;
  category: string;
  status: string;
  starts_on: string | null;
  ends_on: string | null;
  updated_at: string;
  cover_file_id: string | null;
}

type PublicProjectRow = Database["public"]["Views"]["public_project"]["Row"];
const toProject = (r: PublicProjectRow): PublicProject | null =>
  r.id && r.slug && r.name
    ? { id: r.id, slug: r.slug, name: r.name, name_en: r.name_en ?? "", summary: r.summary ?? "", summary_en: r.summary_en ?? "", description_md: r.description_md ?? "", description_md_en: r.description_md_en ?? "", category: r.category ?? "other", status: r.status ?? "active", starts_on: r.starts_on, ends_on: r.ends_on, updated_at: r.updated_at ?? "", cover_file_id: r.cover_file_id }
    : null;

/** Projetos públicos (projeção `public_project`), na ordem de cadastro (a relação informada pela coordenação). */
export async function listPublicProjects(): Promise<PublicProject[]> {
  const client = createPublicClient();
  if (!client) return [];
  const { data } = await client.from("public_project").select("*").order("created_at", { ascending: true });
  return (data ?? []).map(toProject).filter((p): p is PublicProject => p !== null);
}

export async function getPublicProject(slug: string): Promise<PublicProject | null> {
  const client = createPublicClient();
  if (!client) return null;
  const { data } = await client.from("public_project").select("*").eq("slug", slug).maybeSingle();
  return data ? toProject(data) : null;
}

/** Galeria pública do projeto (capa primeiro), só o que o banco libera. */
export async function publicProjectGallery(slug: string, locale: Locale): Promise<PublicGalleryItem[]> {
  if (!(await isDriveAvailable())) return [];
  const client = createPublicClient();
  if (!client) return [];
  const { data } = await client.rpc("public_project_gallery", { p_slug: slug });
  return (data ?? []).map((g) => ({ fileId: g.file_id, alt: (locale === "en" && g.alt_text_en) || g.alt_text, credit: g.credit, caption: "" }));
}

export interface PublicSiteImage {
  fileId: string;
  alt: string;
  credit: string;
}

/** Imagem institucional do site por chave (`home_hero`), só se o acervo a libera (verificada/pública/consentimento). */
export async function publicSiteImage(key: string, locale: Locale): Promise<PublicSiteImage | null> {
  if (!(await isDriveAvailable())) return null;
  const client = createPublicClient();
  if (!client) return null;
  const { data } = await client.rpc("public_site_image", { p_key: key });
  const r = data?.[0];
  if (!r) return null;
  return { fileId: r.file_id, alt: (locale === "en" && r.alt_text_en) || r.alt_text, credit: r.credit };
}

/** Capa pública de várias publicações de uma vez (listas): id do item → id do arquivo. */
export async function publicCoverIds(items: Array<Pick<PublishedItem, "id" | "cover_file_id">>): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!items.some((i) => i.cover_file_id) || !(await isDriveAvailable())) return out;
  const admin = createAdminClient();
  if (!admin) return out;
  await Promise.all(items.filter((i) => i.cover_file_id).map(async (i) => {
    const { data } = await admin.rpc("public_file_info", { p_file: i.cover_file_id! });
    if (data?.[0]) out.set(i.id, i.cover_file_id!);
  }));
  return out;
}

/**
 * Galeria de uma publicação viva (DRIVE-004): só os arquivos que o site pode
 * servir (função `public_gallery` já filtra verificado/público/consentimento);
 * sem Drive disponível não há bytes, então não há galeria.
 */
export async function publicGallery(item: Pick<PublishedItem, "id" | "gallery_file_ids" | "locale">): Promise<PublicGalleryItem[]> {
  if (!item.gallery_file_ids?.length || !(await isDriveAvailable())) return [];
  const client = createPublicClient();
  if (!client) return [];
  const { data } = await client.rpc("public_gallery", { p_publication: item.id });
  return (data ?? []).map((g) => ({ fileId: g.file_id, alt: (item.locale === "en" && g.alt_text_en) || g.alt_text, credit: g.credit, caption: g.caption }));
}

/**
 * URL pública da capa (DRIVE-001) ou `null`: só quando o provedor está
 * configurado e o banco confirma (arquivo verificado, público, com
 * consentimento, capa de publicação viva). Assim a página nunca renderiza uma
 * imagem quebrada nem uma URL do Drive.
 */
export async function publicCoverId(item: Pick<PublishedItem, "cover_file_id">): Promise<string | null> {
  if (!item.cover_file_id || !(await isDriveAvailable())) return null;
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin.rpc("public_file_info", { p_file: item.cover_file_id });
  return data?.[0] ? item.cover_file_id : null;
}

export async function listPublished(type: ContentType, locale: Locale, limit = 50): Promise<PublishedItem[]> {
  const client = createPublicClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from("public_publication")
      .select(FIELDS)
      .eq("type", type)
      .eq("locale", locale)
      .order(type === "event" ? "event_at" : "published_at", { ascending: type === "event" })
      .limit(limit);
    if (error) return [];
    return (data ?? []) as PublishedItem[];
  } catch {
    return [];
  }
}

export async function getPublished(type: ContentType, locale: Locale, slug: string): Promise<PublishedItem | null> {
  const client = createPublicClient();
  if (!client) return null;
  try {
    const { data, error } = await client.from("public_publication").select(FIELDS).eq("type", type).eq("locale", locale).eq("slug", slug).maybeSingle();
    if (error) return null;
    return (data as PublishedItem | null) ?? null;
  } catch {
    return null;
  }
}
