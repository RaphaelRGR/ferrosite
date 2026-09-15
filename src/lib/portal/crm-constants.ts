import type { Enums } from "@/types/database";

/** Constantes puras do CRM (13) — importáveis por Client Components; consultas ficam em crm.ts. */
export type PartnershipStage = Enums<"partnership_stage">;
export type ChallengeStatus = Enums<"challenge_status">;
export type OrganizationKind = Enums<"organization_kind">;
export type ActivityKind = Enums<"relationship_activity_kind">;

export const PARTNERSHIP_STAGES: PartnershipStage[] = ["mapped", "contacted", "meeting", "proposal", "negotiation", "confirmed", "lost", "paused"];
export const CHALLENGE_STATUSES: ChallengeStatus[] = ["received", "screening", "forwarded", "proposal", "accepted", "declined", "closed"];
export const ORGANIZATION_KINDS: OrganizationKind[] = ["company", "public_body", "academic", "association", "other"];
export const ACTIVITY_KINDS: ActivityKind[] = ["note", "call", "email", "meeting", "visit", "proposal"];

/** Recebido → Triagem → Encaminhado → Proposta → Aceito/Recusado → Encerrado (espelho do trigger). */
export const CHALLENGE_TRANSITIONS: Record<ChallengeStatus, ChallengeStatus[]> = {
  received: ["screening", "declined"],
  screening: ["forwarded", "declined", "closed"],
  forwarded: ["proposal", "declined", "closed"],
  proposal: ["accepted", "declined", "closed"],
  accepted: ["closed"],
  declined: ["closed"],
  closed: [],
};
