import { isMissionLate, type MissionStatus, type ProjectStatus } from "./authz";
import type { ChallengeStatus, PartnershipStage } from "./crm-constants";
import type { ContentStatus, ContentType } from "./content-constants";

/**
 * Central da coordenação (12 / guia 20): regras explícitas e testáveis que
 * transformam dados do Portal em uma fila de decisões. Cada alerta carrega a
 * regra que o gerou, a evidência (data e dias) e o link da próxima ação; nada
 * de classificação opaca. Funções puras: a leitura do banco fica em
 * `queries/coordination.ts`.
 */
export type AlertSeverity = "high" | "medium" | "low";

export type AlertRuleId =
  | "mission_overdue_critical"
  | "mission_overdue"
  | "challenge_untriaged"
  | "project_stale"
  | "content_review_stalled"
  | "partner_followup_overdue"
  | "partner_no_followup"
  | "content_approved_unpublished"
  | "project_closed_without_docs";

export interface AlertRule {
  severity: AlertSeverity;
  /** Dias mínimos desde a data de referência para o alerta disparar (0 = assim que a condição vale). */
  thresholdDays: number;
}

/** Limiares padrão. Mudar aqui muda a Central inteira (texto da regra incluído). */
export const ALERT_RULES: Record<AlertRuleId, AlertRule> = {
  mission_overdue_critical: { severity: "high", thresholdDays: 0 },
  challenge_untriaged: { severity: "high", thresholdDays: 3 },
  mission_overdue: { severity: "medium", thresholdDays: 0 },
  project_stale: { severity: "medium", thresholdDays: 30 },
  content_review_stalled: { severity: "medium", thresholdDays: 3 },
  partner_followup_overdue: { severity: "medium", thresholdDays: 0 },
  partner_no_followup: { severity: "medium", thresholdDays: 30 },
  content_approved_unpublished: { severity: "low", thresholdDays: 7 },
  project_closed_without_docs: { severity: "low", thresholdDays: 0 },
};

/** Ordem de exibição: mais urgente primeiro. */
export const ALERT_RULE_ORDER = Object.keys(ALERT_RULES) as AlertRuleId[];

/** Etapas de relacionamento em que a empresa espera retorno nosso. */
export const ACTIVE_PARTNER_STAGES: PartnershipStage[] = ["contacted", "meeting", "proposal", "negotiation"];

export interface CoordinationInput {
  missions: Array<{ id: string; title: string; status: MissionStatus; priority: "low" | "medium" | "high"; due_at: string | null; project: { slug: string; name: string } | null }>;
  /** Projetos ativos e concluídos com a última atividade já consolidada (projeto, missões, histórico). */
  projects: Array<{ id: string; slug: string; name: string; status: ProjectStatus; lastActivityAt: string; hasFinalDocument: boolean }>;
  content: Array<{ id: string; title: string; type: ContentType; locale: string; status: ContentStatus; updated_at: string }>;
  challenges: Array<{ id: string; protocol: string; title: string; organization_name: string; status: ChallengeStatus; created_at: string }>;
  /** Empresas em etapa ativa, com a interação mais recente (se houver). */
  partners: Array<{ id: string; name: string; stage: PartnershipStage; created_at: string; lastActivityAt: string | null; nextAction: string; nextActionAt: string | null }>;
}

export interface CoordinationAlert {
  /** Uma entidade gera no máximo um alerta: `<regra>:<id>`. */
  key: string;
  rule: AlertRuleId;
  severity: AlertSeverity;
  title: string;
  /** Contexto curto (projeto, empresa, protocolo). */
  context: string;
  href: string;
  /** Data de referência da evidência (ISO) e dias decorridos até agora. */
  since: string;
  days: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysSince(iso: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / DAY_MS));
}

const SEVERITY_RANK: Record<AlertSeverity, number> = { high: 0, medium: 1, low: 2 };

export function buildAlerts(input: CoordinationInput, now = new Date(), rules: Record<AlertRuleId, AlertRule> = ALERT_RULES): CoordinationAlert[] {
  const out: CoordinationAlert[] = [];
  const push = (rule: AlertRuleId, id: string, a: Omit<CoordinationAlert, "key" | "rule" | "severity" | "days">) => {
    const days = daysSince(a.since, now);
    if (days < rules[rule].thresholdDays) return;
    out.push({ key: `${rule}:${id}`, rule, severity: rules[rule].severity, days, ...a });
  };

  for (const m of input.missions) {
    if (!m.due_at || !m.project || !isMissionLate(m, now)) continue;
    push(m.priority === "high" ? "mission_overdue_critical" : "mission_overdue", m.id, {
      title: m.title,
      context: m.project.name,
      href: `/portal/projetos/${m.project.slug}/missoes/${m.id}`,
      since: m.due_at,
    });
  }

  for (const c of input.challenges) {
    if (c.status !== "received") continue;
    push("challenge_untriaged", c.id, { title: c.title, context: `${c.protocol} · ${c.organization_name}`, href: `/portal/desafios/${c.id}`, since: c.created_at });
  }

  for (const p of input.projects) {
    if (p.status === "active") push("project_stale", p.id, { title: p.name, context: "", href: `/portal/projetos/${p.slug}`, since: p.lastActivityAt });
    if (p.status === "completed" && !p.hasFinalDocument) push("project_closed_without_docs", p.id, { title: p.name, context: "", href: `/portal/projetos/${p.slug}/arquivos`, since: p.lastActivityAt });
  }

  for (const c of input.content) {
    const rule = c.status === "review" ? "content_review_stalled" : c.status === "approved" ? "content_approved_unpublished" : null;
    if (rule) push(rule, c.id, { title: c.title, context: c.locale.toUpperCase(), href: `/portal/conteudos/${c.id}`, since: c.updated_at });
  }

  for (const o of input.partners) {
    if (!ACTIVE_PARTNER_STAGES.includes(o.stage)) continue;
    const href = `/portal/empresas/${o.id}`;
    // Uma empresa aparece uma vez: próxima ação vencida tem precedência sobre "sem retorno".
    if (o.nextActionAt && new Date(o.nextActionAt).getTime() < now.getTime()) {
      push("partner_followup_overdue", o.id, { title: o.name, context: o.nextAction, href, since: o.nextActionAt });
    } else if (!o.nextActionAt) {
      push("partner_no_followup", o.id, { title: o.name, context: "", href, since: o.lastActivityAt ?? o.created_at });
    }
  }

  return out.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || ALERT_RULE_ORDER.indexOf(a.rule) - ALERT_RULE_ORDER.indexOf(b.rule) || b.days - a.days);
}

/** Agrupa na ordem das regras, mantendo só as que têm alertas. */
export function groupAlerts(alerts: CoordinationAlert[]): Array<{ rule: AlertRuleId; severity: AlertSeverity; items: CoordinationAlert[] }> {
  return ALERT_RULE_ORDER.map((rule) => ({ rule, severity: ALERT_RULES[rule].severity, items: alerts.filter((a) => a.rule === rule) })).filter((g) => g.items.length > 0);
}
