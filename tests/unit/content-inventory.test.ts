import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import inventory from "../../content/editorial-inventory.json";
import { CONTENT_SECTIONS, sectionStatus, shouldRender } from "@/content/quarantine";

/**
 * Quarentena editorial: o inventário é a fonte de verdade e o código só pode
 * marcar seções que existem nele; toda seção inventariada precisa estar marcada.
 */
const STATUSES = new Set(inventory._meta.statuses);
const KINDS = new Set(inventory._meta.kinds);
const DECISIONS = new Set(["confirmar", "corrigir", "descartar", null]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(name)) out.push(p);
  }
  return out;
}

const usedSections = new Set<string>();
for (const file of walk(path.resolve(process.cwd(), "src"))) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(/<UnverifiedContent\s+section="([^"]+)"/g)) usedSections.add(m[1]);
}

describe("inventário editorial", () => {
  const entries = CONTENT_SECTIONS.flatMap((s) => s.entries);

  it("tem ids únicos de seção e de conteúdo", () => {
    const sectionIds = CONTENT_SECTIONS.map((s) => s.id);
    expect(new Set(sectionIds).size).toBe(sectionIds.length);
    const ids = entries.map((e) => e.content_id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("toda entrada tem tipo, status, decisão e valor válidos", () => {
    for (const e of entries) {
      expect(KINDS.has(e.kind), `kind inválido em ${e.content_id}: ${e.kind}`).toBe(true);
      expect(STATUSES.has(e.status), `status inválido em ${e.content_id}`).toBe(true);
      expect(DECISIONS.has(e.decision), `decisão inválida em ${e.content_id}`).toBe(true);
      expect(e.value_pt.trim().length, `valor vazio em ${e.content_id}`).toBeGreaterThan(0);
    }
  });

  it("VERIFIED exige fonte primária, owner e verified_at", () => {
    for (const e of entries.filter((e) => e.status === "VERIFIED")) {
      expect(e.source, `${e.content_id} sem fonte`).toBeTruthy();
      expect(e.owner, `${e.content_id} sem owner`).toBeTruthy();
      expect(e.verified_at, `${e.content_id} sem verified_at`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("toda seção marcada no código existe no inventário", () => {
    const known = new Set(CONTENT_SECTIONS.map((s) => s.id));
    expect([...usedSections].filter((id) => !known.has(id))).toEqual([]);
  });

  it("toda seção inventariada com rota é marcada no código (sem conteúdo institucional sem selo)", () => {
    const routed = CONTENT_SECTIONS.filter((s) => s.route.startsWith("/")).map((s) => s.id);
    expect(routed.filter((id) => !usedSections.has(id))).toEqual([]);
  });

  it("dados pessoais e logos têm consentimento/licença registrados antes de VERIFIED", () => {
    for (const e of entries.filter((e) => (e.kind === "person" || e.kind === "partner") && e.status === "VERIFIED")) {
      expect(e.consent_or_license, `${e.content_id} sem consentimento/licença`).toBeTruthy();
    }
  });
});

describe("política de renderização", () => {
  it("review exibe UNVERIFIED (com marca) e strict oculta; DISCARDED nunca renderiza", () => {
    expect(shouldRender("UNVERIFIED", "review")).toBe(true);
    expect(shouldRender("UNVERIFIED", "strict")).toBe(false);
    expect(shouldRender("VERIFIED", "strict")).toBe(true);
    expect(shouldRender("DISCARDED", "review")).toBe(false);
  });

  it("status da seção é o pior status das entradas", () => {
    for (const s of CONTENT_SECTIONS) {
      const st = sectionStatus(s.id);
      const live = s.entries.filter((e) => e.status !== "DISCARDED" && e.decision !== "descartar");
      if (live.length === 0) expect(st).toBe("DISCARDED");
      else if (live.every((e) => e.status === "VERIFIED" && e.decision === "confirmar")) expect(st).toBe("VERIFIED");
      else expect(st).toBe("UNVERIFIED");
    }
    // uma entrada descartada não esconde a seção inteira (regressão encontrada em FLOW-001):
    // curso.curriculum tem as ementas do protótipo descartadas e as matrizes verificadas.
    expect(sectionStatus("curso.curriculum")).toBe("VERIFIED");
    expect(() => sectionStatus("nao.existe")).toThrow();
  });
});

describe("modo editorial por ambiente (next.config.ts)", () => {
  // Produção na Vercel esconde o que não foi verificado; o resto do mundo revisa com selo.
  const resolve = (env: Record<string, string | undefined>) => env.NEXT_PUBLIC_CONTENT_MODE || (env.VERCEL_ENV === "production" ? "strict" : "review");

  it("produção da Vercel = strict; preview, local e CI = review; variável explícita vence", async () => {
    const config = (await import("node:fs")).readFileSync("next.config.ts", "utf8");
    // a regra testada aqui é a mesma do arquivo de configuração
    expect(config).toContain('process.env.NEXT_PUBLIC_CONTENT_MODE || (process.env.VERCEL_ENV === "production" ? "strict" : "review")');
    expect(resolve({ VERCEL_ENV: "production" })).toBe("strict");
    expect(resolve({ VERCEL_ENV: "preview" })).toBe("review");
    expect(resolve({})).toBe("review");
    expect(resolve({ VERCEL_ENV: "production", NEXT_PUBLIC_CONTENT_MODE: "review" })).toBe("review");
  });

  it("fluxograma, grades e laboratórios estão verificados; o que tem só texto do protótipo continua em quarentena", () => {
    for (const id of ["curso.curriculum", "curso.flowchart", "curso.labs", "laboratorios.hub", "laboratorios.detalhe", "laboratorios.detalhe.conteudo", "empresas.capacidades"]) {
      expect(sectionStatus(id), id).toBe("VERIFIED");
    }
    for (const id of ["home.indicators", "home.news", "home.partners-strip", "curso.pillars", "sobre.historia"]) {
      expect(sectionStatus(id), id).toBe("UNVERIFIED");
    }
  });
});
