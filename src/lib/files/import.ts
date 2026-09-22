import { getDriveClient } from "./drive-connection";
import { requireDriveManager } from "./drive-guard";
import { extensionOf } from "./sniff";
import { uploadToDrive, type UploadError, type UploadTarget } from "./upload";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

/**
 * Importação de uma pasta do Drive humano para o acervo do Portal (DRIVE-004):
 * lê a pasta de origem (escopo readonly), copia item a item pelo mesmo
 * pipeline do upload (magic bytes, allowlist, subpasta lógica, registro
 * verificado, vínculo) e é idempotente — um arquivo cuja cópia já existe
 * (mesmo md5 no mesmo destino) é pulado. Vídeos/ZIP/outros ficam de fora
 * (ficam onde estão; o Portal nunca move nem apaga). Só admin/coordenação.
 * Processa em lotes: o navegador chama repetidas vezes com o cursor.
 */
export interface ImportBatchInput {
  sourceFolderId: string;
  target: UploadTarget;
  cursor: number;
  limit: number;
  classification: Database["public"]["Enums"]["classification"];
  consent: Database["public"]["Enums"]["consent_status"];
  credit: string;
}

export interface ImportItemResult {
  name: string;
  status: "imported" | "skipped" | "ignored" | "error";
  detail?: string;
  fileId?: string;
}

export interface ImportBatchResult {
  total: number;
  next: number | null;
  items: ImportItemResult[];
}

const IMPORTABLE = new Set(["jpg", "jpeg", "png", "webp", "pdf", "docx", "xlsx", "pptx", "stl", "dxf", "dwg", "sldprt"]);

export async function importBatch(input: ImportBatchInput): Promise<{ ok: true; result: ImportBatchResult } | { ok: false; error: UploadError | "invalid_source" }> {
  const guard = await requireDriveManager();
  if (!guard.ok) return { ok: false, error: guard.reason };
  const conn = await getDriveClient();
  if (!conn) return { ok: false, error: "unconfigured" };
  if (!conn.canWrite) return { ok: false, error: "no_write_scope" };
  const list = await conn.client.listFolder(input.sourceFolderId, 100);
  if (!list.ok) return { ok: false, error: list.error === "not_found" ? "invalid_source" : list.error };
  const files = list.items.filter((i) => !i.isFolder).sort((a, b) => a.name.localeCompare(b.name));
  const slice = files.slice(input.cursor, input.cursor + Math.max(1, Math.min(input.limit, 10)));
  const supabase = await createClient();
  const items: ImportItemResult[] = [];
  for (const f of slice) {
    const ext = extensionOf(f.name);
    if (ext && !IMPORTABLE.has(ext)) {
      items.push({ name: f.name, status: "ignored", detail: f.mimeType });
      continue;
    }
    if (!ext && !f.mimeType.startsWith("image/") && f.mimeType !== "application/pdf") {
      items.push({ name: f.name, status: "ignored", detail: f.mimeType });
      continue;
    }
    const meta = await conn.client.getMeta(f.id);
    if (!meta.ok) {
      items.push({ name: f.name, status: "error", detail: meta.error });
      continue;
    }
    if (meta.meta.md5) {
      const { data: dup } = await supabase.from("file_asset").select("id").eq("content_hash", meta.meta.md5).neq("status", "revoked").limit(1);
      if (dup?.length) {
        // já existe no acervo: para galeria de conteúdo, garante o vínculo (idempotente)
        if (input.target.kind === "content") {
          const { count } = await supabase.from("content_file").select("file_id", { count: "exact", head: true }).eq("item_id", input.target.itemId);
          await supabase.from("content_file").upsert({ item_id: input.target.itemId, file_id: dup[0].id, kind: "gallery", position: (count ?? 0) + 1, linked_by: guard.userId }, { onConflict: "item_id,file_id", ignoreDuplicates: true });
        }
        items.push({ name: f.name, status: "skipped", fileId: dup[0].id });
        continue;
      }
    }
    let bytes: Uint8Array;
    try {
      const res = await conn.client.download(f.id);
      if (!res.ok) {
        items.push({ name: f.name, status: "error", detail: `http ${res.status}` });
        continue;
      }
      bytes = new Uint8Array(await res.arrayBuffer());
    } catch (e) {
      items.push({ name: f.name, status: "error", detail: (e as Error).name });
      continue;
    }
    // nome original preservado no nome seguro (com data do arquivo de origem, não de hoje)
    const stamp = meta.meta.id && f.modifiedTime ? new Date(f.modifiedTime) : new Date();
    const r = await uploadToDrive({
      target: input.target,
      originalName: f.name,
      bytes,
      classification: input.classification,
      consent: input.consent,
      consentNote: "",
      credit: input.credit,
      altText: "",
      altTextEn: "",
      stamp,
    });
    items.push(r.ok ? { name: f.name, status: "imported", fileId: r.result.fileId } : { name: f.name, status: "error", detail: r.error });
  }
  const next = input.cursor + slice.length < files.length ? input.cursor + slice.length : null;
  return { ok: true, result: { total: files.length, next, items } };
}
