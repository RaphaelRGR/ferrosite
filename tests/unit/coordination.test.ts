import { describe, expect, it } from "vitest";
import { ALERT_RULE_ORDER, ALERT_RULES, buildAlerts, daysSince, groupAlerts, type CoordinationInput } from "@/lib/portal/coordination";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * Regras da Central da coordenação (12): cada uma dispara no limiar, não antes;
 * uma entidade gera no máximo um alerta; a fila vem ordenada por urgência.
 */
const NOW = new Date("2026-09-26T15:00:00Z");
const ago = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
const ahead = (days: number) => new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
const project = { slug: "trem", name: "Trem" };

const empty = (): CoordinationInput => ({ missions: [], projects: [], content: [], challenges: [], partners: [] });
const rulesOf = (input: CoordinationInput) => buildAlerts(input, NOW).map((a) => a.rule);

describe("buildAlerts", () => {
  it("sem dados, sem alertas", () => {
    expect(buildAlerts(empty(), NOW)).toEqual([]);
  });

  it("missão vencida: prioridade alta é crítica; concluída, cancelada ou sem prazo não alerta", () => {
    const input = empty();
    input.missions = [
      { id: "m1", title: "Alta", status: "in_progress", priority: "high", due_at: ago(2), project },
      { id: "m2", title: "Média", status: "planned", priority: "medium", due_at: ago(1), project },
      { id: "m3", title: "Feita", status: "done", priority: "high", due_at: ago(5), project },
      { id: "m4", title: "Cancelada", status: "cancelled", priority: "low", due_at: ago(5), project },
      { id: "m5", title: "Sem prazo", status: "planned", priority: "high", due_at: null, project },
      { id: "m6", title: "Futura", status: "planned", priority: "high", due_at: ahead(3), project },
    ];
    const alerts = buildAlerts(input, NOW);
    expect(alerts.map((a) => [a.rule, a.title, a.days])).toEqual([
      ["mission_overdue_critical", "Alta", 2],
      ["mission_overdue", "Média", 1],
    ]);
    expect(alerts[0].href).toBe("/portal/projetos/trem/missoes/m1");
    expect(alerts[0].context).toBe("Trem");
  });

  it("projeto ativo só alerta a partir do limiar de dias sem atividade", () => {
    const limit = ALERT_RULES.project_stale.thresholdDays;
    const input = empty();
    input.projects = [
      { id: "p1", slug: "a", name: "Parado", status: "active", lastActivityAt: ago(limit), hasFinalDocument: false },
      { id: "p2", slug: "b", name: "Quase", status: "active", lastActivityAt: ago(limit - 1), hasFinalDocument: false },
      { id: "p3", slug: "c", name: "Pausado", status: "paused", lastActivityAt: ago(200), hasFinalDocument: false },
    ];
    expect(buildAlerts(input, NOW).map((a) => a.title)).toEqual(["Parado"]);
  });

  it("projeto concluído sem documento oficial alerta; com documento não", () => {
    const input = empty();
    input.projects = [
      { id: "p1", slug: "a", name: "Sem doc", status: "completed", lastActivityAt: ago(1), hasFinalDocument: false },
      { id: "p2", slug: "b", name: "Com doc", status: "completed", lastActivityAt: ago(1), hasFinalDocument: true },
    ];
    const alerts = buildAlerts(input, NOW);
    expect(alerts.map((a) => [a.rule, a.title])).toEqual([["project_closed_without_docs", "Sem doc"]]);
    expect(alerts[0].href).toBe("/portal/projetos/a/arquivos");
  });

  it("conteúdo: revisão parada e aprovado sem publicar, cada um no seu limiar", () => {
    const input = empty();
    input.content = [
      { id: "c1", title: "Revisão velha", type: "news", locale: "pt", status: "review", updated_at: ago(ALERT_RULES.content_review_stalled.thresholdDays) },
      { id: "c2", title: "Revisão nova", type: "news", locale: "pt", status: "review", updated_at: ago(0) },
      { id: "c3", title: "Aprovado velho", type: "event", locale: "en", status: "approved", updated_at: ago(ALERT_RULES.content_approved_unpublished.thresholdDays) },
      { id: "c4", title: "Publicado", type: "news", locale: "pt", status: "published", updated_at: ago(90) },
    ];
    const alerts = buildAlerts(input, NOW);
    expect(alerts.map((a) => [a.rule, a.title, a.context])).toEqual([
      ["content_review_stalled", "Revisão velha", "PT"],
      ["content_approved_unpublished", "Aprovado velho", "EN"],
    ]);
  });

  it("desafio recebido sem triagem alerta depois do limiar", () => {
    const input = empty();
    input.challenges = [
      { id: "d1", protocol: "DES-1", title: "Velho", organization_name: "Ferrovia X", status: "received", created_at: ago(ALERT_RULES.challenge_untriaged.thresholdDays) },
      { id: "d2", protocol: "DES-2", title: "Novo", organization_name: "Ferrovia Y", status: "received", created_at: ago(0) },
    ];
    const alerts = buildAlerts(input, NOW);
    expect(alerts.map((a) => [a.title, a.context])).toEqual([["Velho", "DES-1 · Ferrovia X"]]);
  });

  it("empresa: próxima ação vencida tem precedência; sem próxima ação alerta após o limiar; uma empresa, um alerta", () => {
    const limit = ALERT_RULES.partner_no_followup.thresholdDays;
    const input = empty();
    input.partners = [
      { id: "o1", name: "Vencida", stage: "negotiation", created_at: ago(300), lastActivityAt: ago(300), nextAction: "Enviar proposta", nextActionAt: ago(2) },
      { id: "o2", name: "Esquecida", stage: "meeting", created_at: ago(400), lastActivityAt: ago(limit), nextAction: "", nextActionAt: null },
      { id: "o3", name: "Agendada", stage: "proposal", created_at: ago(400), lastActivityAt: ago(90), nextAction: "Reunião", nextActionAt: ahead(5) },
      { id: "o4", name: "Nunca contatada", stage: "contacted", created_at: ago(limit + 5), lastActivityAt: null, nextAction: "", nextActionAt: null },
      { id: "o5", name: "Confirmada", stage: "confirmed", created_at: ago(400), lastActivityAt: ago(400), nextAction: "", nextActionAt: null },
      { id: "o6", name: "Recente", stage: "contacted", created_at: ago(2), lastActivityAt: ago(2), nextAction: "", nextActionAt: null },
    ];
    const alerts = buildAlerts(input, NOW);
    expect(alerts.map((a) => [a.rule, a.title])).toEqual([
      ["partner_followup_overdue", "Vencida"],
      ["partner_no_followup", "Nunca contatada"],
      ["partner_no_followup", "Esquecida"],
    ]);
    expect(alerts[0].context).toBe("Enviar proposta");
    expect(new Set(alerts.map((a) => a.key)).size).toBe(alerts.length);
  });

  it("ordena por gravidade, depois pela ordem das regras e pelos dias", () => {
    const input = empty();
    input.content = [{ id: "c1", title: "Aprovado", type: "news", locale: "pt", status: "approved", updated_at: ago(40) }];
    input.missions = [
      { id: "m1", title: "Média antiga", status: "planned", priority: "low", due_at: ago(20), project },
      { id: "m2", title: "Crítica", status: "planned", priority: "high", due_at: ago(1), project },
    ];
    input.challenges = [{ id: "d1", protocol: "DES-1", title: "Desafio", organization_name: "X", status: "received", created_at: ago(10) }];
    expect(rulesOf(input)).toEqual(["mission_overdue_critical", "challenge_untriaged", "mission_overdue", "content_approved_unpublished"]);
  });

  it("limiares podem ser trocados sem mudar o código das regras", () => {
    const input = empty();
    input.projects = [{ id: "p1", slug: "a", name: "P", status: "active", lastActivityAt: ago(10), hasFinalDocument: false }];
    expect(buildAlerts(input, NOW)).toHaveLength(0);
    expect(buildAlerts(input, NOW, { ...ALERT_RULES, project_stale: { severity: "high", thresholdDays: 7 } })).toHaveLength(1);
  });

  it("groupAlerts mantém a ordem das regras e omite regras vazias", () => {
    const input = empty();
    input.missions = [{ id: "m1", title: "M", status: "planned", priority: "medium", due_at: ago(1), project }];
    input.challenges = [{ id: "d1", protocol: "P", title: "D", organization_name: "X", status: "received", created_at: ago(9) }];
    expect(groupAlerts(buildAlerts(input, NOW)).map((g) => g.rule)).toEqual(["challenge_untriaged", "mission_overdue"]);
  });

  it("daysSince arredonda para baixo e nunca é negativo", () => {
    expect(daysSince(ago(1.9), NOW)).toBe(1);
    expect(daysSince(ahead(1), NOW)).toBe(0);
  });
});

describe("textos da Central", () => {
  it("toda regra tem título, regra, evidência e ação em PT e EN", () => {
    for (const locale of ["pt", "en"] as const) {
      const rules = getDictionary(locale).portal.coordination.rules;
      for (const id of ALERT_RULE_ORDER) {
        const r = rules[id];
        expect(r.title && r.rule && r.evidence && r.action, `${locale}:${id}`).toBeTruthy();
        expect(r.evidence).toContain("{date}");
        expect(r.evidence).toContain("{ago}");
        // regra com limiar precisa dizer o limiar
        if (ALERT_RULES[id].thresholdDays > 0) expect(r.rule, `${locale}:${id}`).toContain("{threshold}");
      }
    }
  });
});
