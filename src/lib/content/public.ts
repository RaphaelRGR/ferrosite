import { isDriveConfigured } from "@/lib/files/drive";
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
}

const FIELDS = "id, type, locale, slug, title, summary, body_md, event_at, event_place, cover_alt, cover_credit, published_at, cover_file_id";

/**
 * URL pública da capa (DRIVE-001) ou `null`: só quando o provedor está
 * configurado e o banco confirma (arquivo verificado, público, com
 * consentimento, capa de publicação viva). Assim a página nunca renderiza uma
 * imagem quebrada nem uma URL do Drive.
 */
export async function publicCoverUrl(item: Pick<PublishedItem, "cover_file_id">): Promise<string | null> {
  if (!item.cover_file_id || !isDriveConfigured()) return null;
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin.rpc("public_file_info", { p_file: item.cover_file_id });
  return data?.[0] ? `/api/midia/${item.cover_file_id}` : null;
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
