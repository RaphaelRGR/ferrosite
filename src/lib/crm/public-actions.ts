"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { dispatchQuietly } from "@/lib/mail/dispatch";
import { createAdminClient } from "@/lib/supabase/admin";
import { allowInMemory, looksAutomated, readChallengeForm, type ChallengeField, type ChallengeInput } from "./challenge-form";

export interface ChallengeSubmitState {
  protocol?: string;
  error?: "invalid" | "rate" | "unavailable" | "server";
  fields?: ChallengeField[];
  /** Valores digitados, devolvidos ao mesmo navegador para o React 19 não limpar o formulário em erro. */
  values?: Omit<ChallengeInput, "consent">;
}

/** Origem hasheada (HMAC com segredo do servidor): nunca guardamos IP em claro (21). */
function submitterHash(ip: string): string {
  const secret = process.env.CHALLENGE_HASH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createHmac("sha256", secret).update(ip).digest("hex").slice(0, 32);
}

/**
 * Envio público "Tenho um desafio" (13): valida, barra bots (honeypot/tempo),
 * limita por origem em memória e no banco, chama a função restrita ao service
 * role e devolve só o protocolo — detalhes não são ecoados (21).
 */
export async function submitChallenge(_prev: ChallengeSubmitState, fd: FormData): Promise<ChallengeSubmitState> {
  const { input, errors } = readChallengeForm(fd);
  const values = { ...input, consent: undefined } as Omit<ChallengeInput, "consent"> & { consent?: undefined };
  delete values.consent;
  if (errors.length > 0) return { error: "invalid", fields: errors, values };
  if (looksAutomated(fd)) return { error: "invalid", fields: [], values };

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const hash = submitterHash(ip);
  if (!allowInMemory(hash)) return { error: "rate", values };

  const admin = createAdminClient();
  if (!admin) return { error: "unavailable", values };
  const locale = String(fd.get("locale") ?? "pt") === "en" ? "en" : "pt";
  const { data, error } = await admin.rpc("submit_research_challenge", {
    p_organization_name: input.organizationName,
    p_contact_name: input.contactName,
    p_contact_email: input.contactEmail,
    p_contact_phone: input.contactPhone,
    p_title: input.title,
    p_description: input.description,
    p_capability_ids: input.capabilityIds,
    p_confidentiality: input.confidentiality,
    p_locale: locale,
    p_submitter_hash: hash,
  });
  if (error) return { error: /limite de envios/.test(error.message) ? "rate" : "server", values };
  after(dispatchQuietly); // confirmação com protocolo (MAIL-001), sem atrasar a resposta
  return { protocol: data ?? undefined };
}
