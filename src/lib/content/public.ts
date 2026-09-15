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
}

const FIELDS = "id, type, locale, slug, title, summary, body_md, event_at, event_place, cover_alt, cover_credit, published_at";

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
