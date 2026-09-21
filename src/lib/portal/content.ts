import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import type { ContentStatus, ContentType } from "./content-constants";

export * from "./content-constants";

/** Leitura de conteúdo editorial e arquivos no servidor (RLS do usuário). */
export type ContentRow = Tables<"content_item"> & { author: Pick<Tables<"profile">, "full_name" | "email"> | null; project: Pick<Tables<"project">, "name" | "slug"> | null };
export type RevisionRow = Tables<"content_revision"> & { author: Pick<Tables<"profile">, "full_name" | "email"> | null };
export type ApprovalRow = Tables<"approval_request"> & { requester: Pick<Tables<"profile">, "full_name" | "email"> | null; reviewer: Pick<Tables<"profile">, "full_name" | "email"> | null };
export type PublicationRow = Tables<"publication">;
export type FileRow = Tables<"file_asset"> & { owner: Pick<Tables<"profile">, "full_name" | "email"> | null };
export type ProjectFileRow = Tables<"project_file"> & { file: FileRow | null };

const CONTENT_SELECT = "*, author:author_id (full_name, email), project:project_id (name, slug)";

export async function listContent(filter: { status?: ContentStatus | "all"; type?: ContentType | "all" } = {}): Promise<ContentRow[]> {
  const supabase = await createClient();
  let q = supabase.from("content_item").select(CONTENT_SELECT).order("updated_at", { ascending: false });
  if (filter.status && filter.status !== "all") q = q.eq("status", filter.status);
  if (filter.type && filter.type !== "all") q = q.eq("type", filter.type);
  const { data } = await q;
  return (data ?? []) as unknown as ContentRow[];
}

export const getContent = cache(async (id: string): Promise<ContentRow | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("content_item").select(CONTENT_SELECT).eq("id", id).maybeSingle();
  return (data as unknown as ContentRow | null) ?? null;
});

export async function listRevisions(itemId: string): Promise<RevisionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("content_revision").select("*, author:author_id (full_name, email)").eq("item_id", itemId).order("revision_no", { ascending: false });
  return (data ?? []) as unknown as RevisionRow[];
}

export async function listApprovals(itemId: string): Promise<ApprovalRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("approval_request")
    .select("*, requester:requested_by (full_name, email), reviewer:reviewer_id (full_name, email)")
    .eq("item_id", itemId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as ApprovalRow[];
}

export async function listPublications(itemId: string): Promise<PublicationRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("publication").select("*").eq("item_id", itemId).order("published_at", { ascending: false });
  return data ?? [];
}

export async function listFiles(): Promise<FileRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("file_asset").select("*, owner:owner_id (full_name, email)").is("archived_at", null).order("created_at", { ascending: false });
  return (data ?? []) as unknown as FileRow[];
}

export const getFile = cache(async (id: string): Promise<FileRow | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("file_asset").select("*, owner:owner_id (full_name, email)").eq("id", id).maybeSingle();
  return (data as unknown as FileRow | null) ?? null;
});

export async function listProjectFiles(projectId: string): Promise<ProjectFileRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_file")
    .select("*, file:file_id (*, owner:owner_id (full_name, email))")
    .eq("project_id", projectId)
    .order("kind")
    .order("position");
  return (data ?? []) as unknown as ProjectFileRow[];
}

/** Destinos de upload (DRIVE-003): projetos em que a pessoa tem papel de escrita (RLS mostra só o que ela vê); overseer vê todos os ativos. */
export async function listUploadTargets(userId: string, overseer: boolean): Promise<Array<{ slug: string; name: string }>> {
  const supabase = await createClient();
  if (overseer) {
    const { data } = await supabase.from("project").select("slug, name").not("status", "in", "(archived,cancelled)").order("name");
    return data ?? [];
  }
  const { data } = await supabase.from("project_membership").select("role, status, project:project_id (slug, name, status)").eq("profile_id", userId).eq("status", "active");
  return ((data ?? []) as unknown as Array<{ role: string; project: { slug: string; name: string; status: string } | null }>)
    .filter((m) => m.role !== "viewer" && m.project && !["archived", "cancelled"].includes(m.project.status))
    .map((m) => ({ slug: m.project!.slug, name: m.project!.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Extensões aceitas para upload (allowlist `uploadable`). */
export async function listUploadableTypes(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("file_type_allowlist").select("extension").eq("uploadable", true).order("extension");
  return (data ?? []).map((r) => r.extension).filter(Boolean);
}

/** Projetos que o usuário vê (para vincular conteúdo/arquivo). */
export async function listProjectOptions(): Promise<Array<{ id: string; name: string }>> {
  const supabase = await createClient();
  const { data } = await supabase.from("project").select("id, name").not("status", "in", "(archived,cancelled)").order("name");
  return data ?? [];
}
