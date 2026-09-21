import { describe, expect, it, vi } from "vitest";
import type { DriveClient } from "@/lib/files/drive";
import { ensureFolderPath, normalizeSegment, projectPath, validatePath } from "@/lib/files/drive-folders";
import { extensionOf, safeFileName, sniffMime } from "@/lib/files/sniff";

const bytes = (...parts: Array<number[] | string>) => new Uint8Array(parts.flatMap((p) => (typeof p === "string" ? [...Buffer.from(p, "latin1")] : p)));
const zipEntry = (name: string, data = "x") => {
  const n = Buffer.from(name);
  const d = Buffer.from(data);
  const h = Buffer.alloc(30);
  h.writeUInt32LE(0x04034b50, 0);
  h.writeUInt16LE(0, 6); // flags sem data descriptor
  h.writeUInt32LE(d.length, 18);
  h.writeUInt32LE(d.length, 22);
  h.writeUInt16LE(n.length, 26);
  h.writeUInt16LE(0, 28);
  return [...h, ...n, ...d];
};

// Tabela drive_folder simulada: `null` desliga a trava; um objeto compartilhado simula duas requisições concorrentes.
let table: Map<string, string> | null = null;
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () =>
    table === null
      ? null
      : {
          from: () => ({
            insert: async (row: { path: string; drive_id: string }) => {
              if (table!.has(row.path)) return { error: { code: "23505", message: "duplicate" } };
              table!.set(row.path, row.drive_id);
              return { error: null };
            },
            select: () => ({ eq: (_c: string, path: string) => ({ maybeSingle: async () => ({ data: table!.has(path) ? { drive_id: table!.get(path) } : null }) }) }),
            update: (patch: { drive_id: string }) => ({ eq: async (_c: string, path: string) => { table!.set(path, patch.drive_id); return { error: null }; } }),
            delete: () => ({ eq: () => ({ eq: async (_c: string, path: string) => { table!.delete(path); return { error: null }; } }) }),
          }),
        },
}));

describe("magic bytes (DRIVE-003)", () => {
  it("reconhece os tipos da allowlist pelo conteúdo, não pela extensão", () => {
    expect(sniffMime(bytes([0xff, 0xd8, 0xff, 0xe0], "JFIF....."))).toBe("image/jpeg");
    expect(sniffMime(bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "...."))).toBe("image/png");
    expect(sniffMime(bytes("RIFF", [0, 0, 0, 0], "WEBPVP8 "))).toBe("image/webp");
    expect(sniffMime(bytes("%PDF-1.7\n%..."))).toBe("application/pdf");
    expect(sniffMime(bytes("AC1032....."))).toBe("image/vnd.dwg");
    expect(sniffMime(bytes("  0\nSECTION\n  2\nHEADER\n"))).toBe("application/dxf");
    expect(sniffMime(bytes("solid peca\n facet normal 0 0 1\n endsolid peca\n"))).toBe("model/stl");
    const stl = bytes(new Array(80).fill(0), [1, 0, 0, 0], new Array(50).fill(7));
    expect(sniffMime(stl)).toBe("model/stl");
    expect(sniffMime(bytes([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], "........"))).toBe("application/sldworks");
    expect(sniffMime(bytes(zipEntry("[Content_Types].xml"), zipEntry("word/document.xml")))).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    expect(sniffMime(bytes(zipEntry("[Content_Types].xml"), zipEntry("xl/workbook.xml")))).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(sniffMime(bytes(zipEntry("[Content_Types].xml"), zipEntry("ppt/presentation.xml")))).toBe("application/vnd.openxmlformats-officedocument.presentationml.presentation");
  });

  it("recusa executáveis, scripts, ZIP genérico, vídeo e conteúdo curto", () => {
    expect(sniffMime(bytes("MZ......this program"))).toBeNull(); // .exe
    expect(sniffMime(bytes([0x7f], "ELF........"))).toBeNull();
    expect(sniffMime(bytes("#!/bin/sh\necho oi\n"))).toBeNull();
    expect(sniffMime(bytes("<html><script>alert(1)</script>"))).toBeNull();
    expect(sniffMime(bytes(zipEntry("malware.exe", "MZ")))).toBeNull(); // zip sem raiz Office
    expect(sniffMime(bytes(zipEntry("[Content_Types].xml"), zipEntry("evil/run.exe")))).toBeNull();
    expect(sniffMime(bytes([0, 0, 0, 0x18], "ftypmp42"))).toBeNull(); // mp4: só registro, não upload
    expect(sniffMime(bytes("solid"))).toBeNull(); // curto demais
    expect(sniffMime(bytes(new Array(80).fill(0), [2, 0, 0, 0], new Array(50).fill(7)))).toBeNull(); // binário STL com contagem inconsistente
  });

  it("extensão e nome seguro: canônico por tipo, com data, sem caminhos/acentos", () => {
    expect(extensionOf("Foto Final.JPEG")).toBe("jpeg");
    expect(extensionOf("semext")).toBe("");
    expect(safeFileName("../Relatório Visita 2026 ??.JPEG", "image/jpeg", new Date("2026-09-21T12:00:00Z"))).toBe("2026-09-21 Relatorio Visita 2026.jpg");
    expect(safeFileName("peça.stl", "model/stl", new Date("2026-01-02T00:00:00Z"))).toBe("2026-01-02 peca.stl");
    expect(safeFileName(".png", "image/png", new Date("2026-01-02T00:00:00Z"))).toBe("2026-01-02 arquivo.png");
  });
});

describe("estrutura de pastas", () => {
  it("segmentos normalizados e caminho por entidade", () => {
    expect(normalizeSegment("Ferrovia nas Escolas!")).toBe("ferrovia-nas-escolas");
    expect(projectPath("Comunica Ferro", "galeria")).toEqual(["projetos", "comunica-ferro", "galeria"]);
    expect(projectPath("x", "missoes", "6f54019f-b40e-4706-a9d3-1ae694066578")).toEqual(["projetos", "x", "missoes", "6f54019f"]);
    expect(validatePath(["visitas", "2026-1"])).toBe(true);
    expect(validatePath(["../etc"])).toBe(false);
    expect(validatePath([])).toBe(false);
  });

  it("ensureFolderPath: reaproveita pasta existente e cria só o que falta, do topo para baixo", async () => {
    const existing: Record<string, string> = { "root/projetos": "p1" };
    const created: string[] = [];
    const drive = {
      findChildFolder: vi.fn(async (parent: string, name: string) => ({ ok: true as const, id: existing[`${parent}/${name}`] ?? null })),
      createFolder: vi.fn(async (parent: string, name: string) => {
        const id = `new-${name}`;
        existing[`${parent}/${name}`] = id;
        created.push(`${parent}/${name}`);
        return { ok: true as const, id };
      }),
    } as unknown as DriveClient;
    const r = await ensureFolderPath(drive, "root", ["projetos", "comunica-ferro", "galeria"], "u1");
    expect(r).toEqual({ ok: true, id: "new-galeria", path: "projetos/comunica-ferro/galeria" });
    expect(created).toEqual(["p1/comunica-ferro", "new-comunica-ferro/galeria"]);
    expect(await ensureFolderPath(drive, "root", ["ok", "Bad Segment"], "u1")).toEqual({ ok: false, error: "invalid_path" });
    const failing = { ...drive, findChildFolder: vi.fn(async () => ({ ok: false as const, error: "forbidden" as const })) } as unknown as DriveClient;
    expect(await ensureFolderPath(failing, "root", ["x"], "u1")).toMatchObject({ ok: false, error: "forbidden" });
  });

  it("duas requisições simultâneas para o mesmo caminho criam UMA pasta no Drive (trava pela tabela)", async () => {
    table = new Map();
    let creates = 0;
    const drive = {
      findChildFolder: vi.fn(async () => {
        await new Promise((r) => setTimeout(r, 30)); // latência do Drive: sem trava, ambos veriam "não existe"
        return { ok: true as const, id: null };
      }),
      createFolder: vi.fn(async (_p: string, name: string) => {
        creates += 1;
        return { ok: true as const, id: `id-${name}-${creates}` };
      }),
    } as unknown as DriveClient;
    const [a, b] = await Promise.all([ensureFolderPath(drive, "root", ["projetos", "x", "galeria"], "u1"), ensureFolderPath(drive, "root", ["projetos", "x", "galeria"], "u2")]);
    expect(a).toEqual(b);
    expect(creates).toBe(3); // projetos, x, galeria — uma vez cada
    expect(table.get("projetos/x/galeria")).toBe((a as { id: string }).id);
    table = null;
  });
});
