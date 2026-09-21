import { createAdminClient } from "@/lib/supabase/admin";
import type { DriveClient, DriveError } from "./drive";

/**
 * Estrutura da pasta raiz (DRIVE-003), criada sob demanda e espelhando as
 * entidades do Portal — nunca a árvore humana do Drive:
 *   projetos/<slug>/{galeria,documentos,tecnico,missoes/<id-curto>}
 *   conteudos/<tipo>/<slug> · visitas/<periodo> · relatorios/<ano> · comunicacao · acervo-historico
 * O caminho lógico é a única fonte; o id do Drive fica em cache (`drive_folder`, só service role).
 * O Portal só cria; nunca move, renomeia ou apaga.
 */
export const PROJECT_AREAS = ["galeria", "documentos", "tecnico", "missoes"] as const;
export type ProjectArea = (typeof PROJECT_AREAS)[number];
export const TOP_AREAS = ["conteudos", "visitas", "relatorios", "comunicacao", "acervo-historico"] as const;
export type TopArea = (typeof TOP_AREAS)[number];

const SEGMENT = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function normalizeSegment(v: string): string {
  return v.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

export function projectPath(slug: string, area: ProjectArea, missionId?: string): string[] {
  const parts = ["projetos", normalizeSegment(slug), area];
  if (area === "missoes" && missionId) parts.push(missionId.replace(/-/g, "").slice(0, 8));
  return parts;
}

export function validatePath(parts: string[]): boolean {
  return parts.length > 0 && parts.length <= 6 && parts.every((p) => SEGMENT.test(p));
}

/** Nome visível no Drive: igual ao segmento (estável, sem espaços). */
const displayName = (segment: string) => segment;

export async function ensureFolderPath(
  drive: DriveClient,
  rootId: string,
  parts: string[],
  userId: string | null,
): Promise<{ ok: true; id: string; path: string } | { ok: false; error: DriveError | "invalid_path"; detail?: string }> {
  if (!validatePath(parts)) return { ok: false, error: "invalid_path" };
  const admin = createAdminClient();
  let parent = rootId;
  let path = "";
  for (const seg of parts) {
    path = path ? `${path}/${seg}` : seg;
    const resolved = await resolveSegment(drive, admin, parent, seg, path, userId);
    if (!resolved.ok) return resolved;
    parent = resolved.id;
  }
  return { ok: true, id: parent, path };
}

const PENDING = "pending-";
const isPending = (id: string) => id.startsWith(PENDING);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Um segmento por vez. A linha em `drive_folder` funciona como trava: quem
 * consegue inserir o `pending-…` cria (ou acha) a pasta no Drive e grava o id;
 * quem perde a corrida espera o id aparecer. Sem isso, dois uploads
 * simultâneos criam duas pastas com o mesmo nome (o Drive permite).
 */
async function resolveSegment(
  drive: DriveClient,
  admin: ReturnType<typeof createAdminClient>,
  parent: string,
  seg: string,
  path: string,
  userId: string | null,
): Promise<{ ok: true; id: string } | { ok: false; error: DriveError; detail?: string }> {
  if (!admin) return findOrCreate(drive, parent, seg);
  const claim = `${PENDING}${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
  const { error: claimError } = await admin.from("drive_folder").insert({ path, drive_id: claim, created_by: userId });
  if (!claimError) {
    const r = await findOrCreate(drive, parent, seg);
    if (!r.ok) {
      await admin.from("drive_folder").delete().eq("path", path).eq("drive_id", claim);
      return r;
    }
    await admin.from("drive_folder").update({ drive_id: r.id }).eq("path", path);
    return r;
  }
  // já existe (ou alguém está criando): espera até 15 s pelo id real
  for (let i = 0; i < 30; i += 1) {
    const { data } = await admin.from("drive_folder").select("drive_id").eq("path", path).maybeSingle();
    if (data && !isPending(data.drive_id)) return { ok: true, id: data.drive_id };
    if (!data) return resolveSegment(drive, admin, parent, seg, path, userId); // o outro desistiu: tenta a trava de novo
    await sleep(500);
  }
  return { ok: false, error: "provider", detail: "pasta em criação por outra requisição; tente de novo" };
}

async function findOrCreate(drive: DriveClient, parent: string, seg: string): Promise<{ ok: true; id: string } | { ok: false; error: DriveError; detail?: string }> {
  const found = await drive.findChildFolder(parent, displayName(seg));
  if (!found.ok) return found;
  if (found.id) return { ok: true, id: found.id };
  const created = await drive.createFolder(parent, displayName(seg));
  if (!created.ok) return created;
  return { ok: true, id: created.id };
}
