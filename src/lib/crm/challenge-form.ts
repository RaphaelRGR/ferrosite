import { isCapabilityId, type CapabilityId } from "@/data/capabilities";

/**
 * Validação do formulário público "Tenho um desafio" (13/21), compartilhada
 * pela Server Action e por testes. Limites espelham os CHECKs do banco.
 */
export interface ChallengeInput {
  organizationName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  title: string;
  description: string;
  capabilityIds: CapabilityId[];
  confidentiality: boolean;
  consent: boolean;
}

export type ChallengeField = keyof ChallengeInput;

export const LIMITS = { organizationName: [2, 200], contactName: [2, 160], title: [5, 200], description: [20, 6000] } as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[\d\s()+.-]{8,20}$/;

export function readChallengeForm(fd: FormData): { input: ChallengeInput; errors: ChallengeField[] } {
  const s = (k: string, max = 6000) => String(fd.get(k) ?? "").trim().slice(0, max);
  const input: ChallengeInput = {
    organizationName: s("organizationName", 200),
    contactName: s("contactName", 160),
    contactEmail: s("contactEmail", 254).toLowerCase(),
    contactPhone: s("contactPhone", 20),
    title: s("title", 200),
    description: s("description", 6000),
    capabilityIds: fd.getAll("capabilityIds").map(String).filter(isCapabilityId),
    confidentiality: fd.get("confidentiality") === "on",
    consent: fd.get("consent") === "on",
  };
  const errors: ChallengeField[] = [];
  for (const key of Object.keys(LIMITS) as Array<keyof typeof LIMITS>) {
    const [min, max] = LIMITS[key];
    if (input[key].length < min || input[key].length > max) errors.push(key);
  }
  if (!EMAIL.test(input.contactEmail)) errors.push("contactEmail");
  if (input.contactPhone && !PHONE.test(input.contactPhone)) errors.push("contactPhone");
  if (!input.consent) errors.push("consent");
  return { input, errors };
}

/** Honeypot preenchido ou envio rápido demais (< 3 s) ⇒ provável bot (21: anti-spam). */
export function looksAutomated(fd: FormData, now = Date.now()): boolean {
  const honey = String(fd.get("website") ?? "");
  const started = Number(fd.get("startedAt") ?? 0);
  return honey.length > 0 || !Number.isFinite(started) || started <= 0 || now - started < 3000;
}

/** Limite em memória por origem (primeira barreira; o banco impõe o limite definitivo). */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const buckets = new Map<string, number[]>();

export function allowInMemory(key: string, now = Date.now()): boolean {
  const list = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_PER_WINDOW) {
    buckets.set(key, list);
    return false;
  }
  list.push(now);
  buckets.set(key, list);
  return true;
}

export function resetInMemory(): void {
  buckets.clear();
}
