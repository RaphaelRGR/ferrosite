import { beforeEach, describe, expect, it } from "vitest";
import { allowInMemory, looksAutomated, readChallengeForm, resetInMemory } from "@/lib/crm/challenge-form";

/** CRM-001: validação, anti-bot e limite em memória do formulário "Tenho um desafio" (13/21). */
function form(over: Record<string, string | string[]> = {}): FormData {
  const fd = new FormData();
  const base: Record<string, string | string[]> = {
    organizationName: "ACME Ferrovias",
    contactName: "Pessoa de Contato",
    contactEmail: "Contato@ACME.invalid",
    contactPhone: "(47) 99999-0000",
    title: "Desgaste prematuro de rodas",
    description: "Descrição longa o suficiente do problema técnico para triagem.",
    capabilityIds: ["material-rodante", "logos", "materiais"],
    consent: "on",
    startedAt: String(Date.now() - 10_000),
    ...over,
  };
  for (const [k, v] of Object.entries(base)) for (const x of Array.isArray(v) ? v : [v]) fd.append(k, x);
  return fd;
}

describe("readChallengeForm", () => {
  it("normaliza e-mail, filtra capacidades fora da taxonomia e aceita entrada válida", () => {
    const { input, errors } = readChallengeForm(form());
    expect(errors).toEqual([]);
    expect(input.contactEmail).toBe("contato@acme.invalid");
    expect(input.capabilityIds).toEqual(["material-rodante", "materiais"]);
    expect(input.consent).toBe(true);
    expect(input.confidentiality).toBe(false);
  });

  it("marca campos curtos, e-mail/telefone inválidos e consentimento ausente", () => {
    const { errors } = readChallengeForm(form({ organizationName: "A", title: "abc", description: "curta", contactEmail: "sem-arroba", contactPhone: "abc", consent: "" }));
    expect(errors.sort()).toEqual(["consent", "contactEmail", "contactPhone", "description", "organizationName", "title"].sort());
  });

  it("corta ao máximo do banco (descrição 6000)", () => {
    const { input, errors } = readChallengeForm(form({ description: "x".repeat(7000) }));
    expect(errors).toEqual([]);
    expect(input.description).toHaveLength(6000);
  });
});

describe("anti-bot", () => {
  it("honeypot preenchido ou envio em menos de 3 s é automatizado", () => {
    expect(looksAutomated(form())).toBe(false);
    expect(looksAutomated(form({ website: "http://spam" }))).toBe(true);
    expect(looksAutomated(form({ startedAt: String(Date.now() - 500) }))).toBe(true);
    expect(looksAutomated(form({ startedAt: "" }))).toBe(true);
  });
});

describe("limite em memória", () => {
  beforeEach(() => resetInMemory());
  it("permite 5 por hora por origem e libera após a janela", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) expect(allowInMemory("h", t0 + i)).toBe(true);
    expect(allowInMemory("h", t0 + 10)).toBe(false);
    expect(allowInMemory("outra", t0 + 10)).toBe(true);
    expect(allowInMemory("h", t0 + 60 * 60 * 1000 + 1)).toBe(true);
  });
});
