import type { BadgeTone } from "@/components/ui/Badge";
import type { ContentStatus } from "@/lib/portal/content-constants";

export const CONTENT_STATUS_TONE: Record<ContentStatus, BadgeTone> = {
  draft: "neutral",
  review: "info",
  changes_requested: "warning",
  approved: "success",
  scheduled: "info",
  published: "success",
  unpublished: "warning",
  archived: "neutral",
};
