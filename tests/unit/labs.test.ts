import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CAPABILITY_IDS, CAPABILITY_LINKS, capabilitiesOf, isCapabilityId, labsWithCapability } from "@/content/capabilities";
import { getLab, hasDetail, LABS, LABS_SOURCE } from "@/content/labs";
import { pt } from "@/i18n/dictionaries/pt";
import { en } from "@/i18n/dictionaries/en";

/**
 * LAB-001: content/labs.json é derivado do portfólio (sha256), cobre os 14
 * laboratórios do índice (11 detalhados, 3 pendentes não inventados), não
 * vaza contatos e distingue potencial de capacidade.
 */
describe("laboratórios (content/labs.json)", () => {
  it("foi gerado do PDF atual do portfólio (sha256)", () => {
    const pdf = readFileSync(path.resolve(process.cwd(), LABS_SOURCE.file));
    expect(createHash("sha256").update(pdf).digest("hex")).toBe(LABS_SOURCE.sha256);
  });

  it("tem os 14 laboratórios do índice, com ids únicos", () => {
    expect(LABS).toHaveLength(14);
    expect(new Set(LABS.map((l) => l.id)).size).toBe(14);
    expect(LABS.map((l) => l.acronym)).toEqual([
      "LMSE", "LMS", "LabDSE", "Lab. Robótica Avançada", "NSO", "LaCMa", "LIFE", "Aeolus", "LTS", "LAV", "LDTPav", "LABMCI", "LASC", "IDA Lab",
    ]);
  });

  it("11 páginas do PDF lidas; 3 só no índice sem conteúdo inventado; Robótica marcada como duplicata do LabDSE", () => {
    const fromPages = LABS.filter((l) => l.page > 2);
    expect(fromPages).toHaveLength(11);
    const detailed = LABS.filter(hasDetail);
    expect(detailed.map((l) => l.id)).toEqual(["lmse", "lms", "labdse", "nso", "lacma", "life", "aeolus", "lts", "lav", "ldtpav"]);
    for (const l of detailed) {
      expect(l.about.length, l.id).toBeGreaterThanOrEqual(3);
      expect(l.history.length, l.id).toBeGreaterThanOrEqual(3);
      expect(l.applications.length, l.id).toBeGreaterThanOrEqual(3);
      expect(l.responsible, l.id).toMatch(/^Prof\./);
    }
    const indexOnly = LABS.filter((l) => l.page === 2);
    expect(indexOnly.map((l) => l.id)).toEqual(["labmci", "lasc", "idalab"]);
    for (const l of indexOnly) {
      expect(l.about).toEqual([]);
      expect(l.responsible).toBe("");
    }
    expect(getLab("robotica")?.duplicateOf).toBe("labdse");
    expect(getLab("robotica")?.about).toEqual([]);
  });

  it("não publica e-mail, telefone, sala, link ou Lattes (14/21)", () => {
    const text = JSON.stringify(LABS);
    expect(text).not.toMatch(/@/);
    expect(text).not.toMatch(/\+55|\(\d{2}\)\s?\d{4,5}-\d{4}/);
    expect(text).not.toMatch(/Sala\s|Bloco [A-Z]\b|Lattes|ufsc\.br|https?:\/\//i);
  });

  it("linguagem prospectiva do PDF vira flag prospective (LDTPav), não serviço", () => {
    const ldtpav = getLab("ldtpav")!;
    expect(ldtpav.applications.every((a) => a.prospective)).toBe(true);
    const lmse = getLab("lmse")!;
    expect(lmse.applications.some((a) => a.prospective)).toBe(false);
    for (const l of LABS) for (const a of l.applications) expect(a.prospective).toBe(/potencial|podem ser adaptad|aplicável/i.test(a.text));
  });

  it("parágrafos não quebram no meio de palavras nem de frases", () => {
    for (const l of LABS) {
      for (const p of [...l.about, ...l.history, ...l.applications.map((a) => a.text)]) {
        expect(p, l.id).not.toMatch(/\b\w- \w/); // "pós- graduação"
        expect(p, l.id).not.toMatch(/(^|[a-z]) [b-df-hj-np-z] [a-z]{4,}/); // "de d esempenho" (não "20 m de")
        expect(p[0], l.id).toMatch(/[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9"]/);
      }
    }
  });
});

describe("taxonomia de capacidades", () => {
  it("são as 20 capacidades de 14, traduzidas em PT e EN", () => {
    expect(CAPABILITY_IDS).toHaveLength(20);
    for (const id of CAPABILITY_IDS) {
      expect(pt.capabilities[id]).toBeTruthy();
      expect(en.capabilities[id]).toBeTruthy();
    }
    expect(isCapabilityId("ruido")).toBe(true);
    expect(isCapabilityId("logos")).toBe(false);
  });

  it("todo vínculo aponta para lab e capacidade existentes, sem duplicar o par", () => {
    const pairs = new Set<string>();
    for (const link of CAPABILITY_LINKS) {
      expect(getLab(link.labId), link.labId).toBeDefined();
      expect(isCapabilityId(link.capability)).toBe(true);
      const key = `${link.labId}:${link.capability}`;
      expect(pairs.has(key), key).toBe(false);
      pairs.add(key);
    }
  });

  it("nível 'offered' só para labs detalhados; 'pending' só para labs sem página; duplicata sem vínculo", () => {
    for (const link of CAPABILITY_LINKS) {
      const lab = getLab(link.labId)!;
      if (link.level === "offered" || link.level === "prospective") expect(hasDetail(lab), link.labId).toBe(true);
      if (link.level === "pending") expect(lab.page, link.labId).toBe(2);
    }
    expect(capabilitiesOf("robotica")).toEqual([]);
    // LDTPav: só "materiais" é capacidade descrita; via permanente/geotecnia são potencial (14: não prometer)
    expect(capabilitiesOf("ldtpav").filter((c) => c.level === "offered").map((c) => c.capability)).toEqual(["materiais"]);
    expect(labsWithCapability("via-permanente").find((x) => x.lab.id === "ldtpav")?.level).toBe("prospective");
  });

  it("todo lab detalhado tem ao menos uma capacidade descrita", () => {
    for (const lab of LABS.filter(hasDetail)) {
      expect(capabilitiesOf(lab.id).some((c) => c.level === "offered"), lab.id).toBe(true);
    }
  });
});
