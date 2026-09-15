import type { Enums } from "@/types/database";

/** Constantes puras de conteúdo/arquivos (17/18) — importáveis por Client Components. */
export type ContentType = Enums<"content_type">;
export type ContentStatus = Enums<"content_status">;
export type FileProvider = Enums<"file_provider">;
export type FileStatus = Enums<"file_status">;
export type FileLinkKind = Enums<"file_link_kind">;
export type ConsentStatus = Enums<"consent_status">;

export const CONTENT_TYPES: ContentType[] = ["news", "event", "project_update", "experience", "partner_case", "lab_case"];
export const CONTENT_STATUSES: ContentStatus[] = ["draft", "review", "changes_requested", "approved", "scheduled", "published", "unpublished", "archived"];
export const FILE_PROVIDERS: FileProvider[] = ["google_drive", "external_link"];
export const FILE_STATUSES: FileStatus[] = ["registered", "verified", "archived", "revoked"];
export const FILE_LINK_KINDS: FileLinkKind[] = ["attachment", "cover", "gallery", "official_document"];
export const CONSENT_STATUSES: ConsentStatus[] = ["not_required", "pending", "granted", "refused"];
export const FILE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf", "video/mp4"] as const;

/** Espelho do trigger guard_content_status (18). */
export const CONTENT_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  draft: ["review", "archived"],
  review: ["approved", "changes_requested", "draft", "archived"],
  changes_requested: ["draft", "review", "archived"],
  approved: ["scheduled", "published", "draft", "archived"],
  scheduled: ["published", "approved", "draft", "archived"],
  published: ["unpublished", "draft"],
  unpublished: ["draft", "published", "archived"],
  archived: ["draft"],
};

/** Transições reservadas a aprovadores (admin/coordenação). */
export const APPROVER_TARGETS: ContentStatus[] = ["approved", "published", "scheduled", "unpublished", "changes_requested"];

/** Tipos com página pública já consumindo a projeção (os demais só ficam na projeção até a tela existir). */
export const CONTENT_TYPE_PUBLIC_PATH: Partial<Record<ContentType, string>> = { news: "/noticias", event: "/eventos" };
