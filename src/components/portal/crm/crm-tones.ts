import type { BadgeTone } from "@/components/ui/Badge";
import type { ChallengeStatus } from "@/lib/portal/crm-constants";

export const CHALLENGE_TONE: Record<ChallengeStatus, BadgeTone> = {
  received: "warning",
  screening: "info",
  forwarded: "info",
  proposal: "info",
  accepted: "success",
  declined: "danger",
  closed: "neutral",
};
