import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/config";
import { CONTENT_TYPE_PUBLIC_PATH } from "@/lib/portal/content-constants";
import type { ContentType } from "@/lib/portal/content-constants";

/**
 * Templates de e-mail (MAIL-001): puros, PT e EN completos (sem fallback
 * silencioso), texto simples + HTML mínimo com tudo escapado. Recebem só o
 * payload guardado na caixa de saída — nunca a descrição do desafio nem dados
 * pessoais além do nome de quem escreveu (13/21). Sem `siteUrl` não inventamos
 * domínio: as linhas de link ficam de fora.
 */
export const MAIL_TEMPLATES = ["challenge_received", "content_review_requested", "content_decided", "content_published", "membership_granted"] as const;
export type MailTemplate = (typeof MAIL_TEMPLATES)[number];

export interface RenderedMail {
  subject: string;
  text: string;
  html: string;
}

export interface RenderInput {
  template: string;
  locale: string;
  payload: unknown;
  /** Origem absoluta do site (ex.: https://exemplo.ufsc.br) ou vazio quando não definida. */
  siteUrl: string;
}

const SENDER_NAME = { pt: "Curso de Engenharia Ferroviária e Metroviária — UFSC Joinville", en: "Railway and Metro Engineering Program — UFSC Joinville" } as const;
const NO_REPLY = { pt: "Mensagem automática; não responda a este e-mail.", en: "Automatic message; please do not reply to this e-mail." } as const;
const ROLE_LABEL: Record<Locale, Record<string, string>> = {
  pt: { leader: "líder", member: "membro", viewer: "leitura", external: "colaboração externa" },
  en: { leader: "leader", member: "member", viewer: "read-only", external: "external collaborator" },
};
const DECISION_LABEL: Record<Locale, Record<string, string>> = {
  pt: { approved: "aprovado", changes_requested: "devolvido com pedido de alterações" },
  en: { approved: "approved", changes_requested: "returned with change requests" },
};

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

function asLocale(v: string): Locale {
  return v === "en" ? "en" : "pt";
}
function field(payload: unknown, key: string): string {
  const v = payload && typeof payload === "object" ? (payload as Record<string, unknown>)[key] : undefined;
  return typeof v === "string" ? v.replace(/[\r\n\t]+/g, " ").trim().slice(0, 300) : "";
}
function absolute(siteUrl: string, path: string): string {
  return siteUrl ? new URL(path, siteUrl).toString() : "";
}
function publicContentPath(payload: unknown): string {
  const type = field(payload, "type") as ContentType;
  const base = CONTENT_TYPE_PUBLIC_PATH[type];
  const slug = field(payload, "slug");
  if (!base || !slug) return "";
  return localizePath(asLocale(field(payload, "contentLocale")), `${base}/${slug}`);
}
function compose(locale: Locale, subject: string, lines: string[], link?: { label: string; href: string }): RenderedMail {
  const body = lines.filter(Boolean);
  const textLines = [...body];
  if (link?.href) textLines.push("", `${link.label}: ${link.href}`);
  textLines.push("", NO_REPLY[locale], SENDER_NAME[locale]);
  const htmlParts = body.map((l) => `<p>${escapeHtml(l)}</p>`);
  if (link?.href) htmlParts.push(`<p><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></p>`);
  htmlParts.push(`<p style="color:#666;font-size:12px">${escapeHtml(NO_REPLY[locale])}<br>${escapeHtml(SENDER_NAME[locale])}</p>`);
  return {
    subject,
    text: textLines.join("\n"),
    html: `<!doctype html><html lang="${locale}"><body style="font-family:system-ui,sans-serif;line-height:1.5">${htmlParts.join("")}</body></html>`,
  };
}

/** Devolve `null` para template desconhecido (a linha fica marcada como falha, nunca enviada "em branco"). */
export function renderMail({ template, locale: rawLocale, payload, siteUrl }: RenderInput): RenderedMail | null {
  const locale = asLocale(rawLocale);
  const name = field(payload, "contactName");
  switch (template as MailTemplate) {
    case "challenge_received": {
      const protocol = field(payload, "protocol");
      const title = field(payload, "title");
      if (!protocol) return null;
      return locale === "pt"
        ? compose("pt", `Desafio recebido — protocolo ${protocol}`, [
            name ? `Olá, ${name}.` : "Olá.",
            `Recebemos o seu desafio "${title}" e registramos o protocolo ${protocol}.`,
            "A coordenação do curso fará a triagem e entrará em contato pelo e-mail informado. Guarde o protocolo para acompanhar a conversa.",
            "Os dados enviados ficam restritos à coordenação e às pessoas designadas para a triagem; não aparecem no site.",
          ], siteUrl ? { label: "Página Para Empresas", href: absolute(siteUrl, "/pt/para-empresas") } : undefined)
        : compose("en", `Challenge received — protocol ${protocol}`, [
            name ? `Hello, ${name}.` : "Hello.",
            `We received your challenge "${title}" and registered it under protocol ${protocol}.`,
            "The program coordination will screen it and get back to you at the e-mail you provided. Keep the protocol number for follow-up.",
            "What you sent is restricted to the coordination and the people assigned to screening; it is not shown on the website.",
          ], siteUrl ? { label: "For Companies page", href: absolute(siteUrl, "/en/para-empresas") } : undefined);
    }
    case "content_review_requested": {
      const title = field(payload, "title");
      const link = siteUrl ? { label: locale === "pt" ? "Abrir a fila de revisão" : "Open the review queue", href: absolute(siteUrl, "/portal/conteudos?situacao=review") } : undefined;
      return locale === "pt"
        ? compose("pt", `Revisão pedida: ${title}`, [`O conteúdo "${title}" foi enviado para revisão e aguarda decisão da coordenação.`, "Aprove, peça alterações ou devolva a rascunho no Portal."], link)
        : compose("en", `Review requested: ${title}`, [`The content "${title}" was submitted for review and awaits a decision from the coordination.`, "Approve, request changes or return it to draft in the Portal."], link);
    }
    case "content_decided": {
      const title = field(payload, "title");
      const decision = field(payload, "decision");
      const label = DECISION_LABEL[locale][decision] ?? decision;
      const link = siteUrl ? { label: locale === "pt" ? "Abrir meus conteúdos" : "Open my content", href: absolute(siteUrl, "/portal/conteudos") } : undefined;
      return locale === "pt"
        ? compose("pt", `Conteúdo ${label}: ${title}`, [`Seu conteúdo "${title}" foi ${label}.`, decision === "approved" ? "A coordenação pode publicá-lo ou agendar a publicação; você será avisado quando for ao ar." : "Veja o comentário da revisão no Portal, ajuste e envie de novo para revisão."], link)
        : compose("en", `Content ${label}: ${title}`, [`Your content "${title}" was ${label}.`, decision === "approved" ? "The coordination can now publish it or schedule the publication; you will be notified when it goes live." : "Read the review comment in the Portal, adjust and submit it for review again."], link);
    }
    case "content_published": {
      const title = field(payload, "title");
      const path = publicContentPath(payload);
      const link = siteUrl && path ? { label: locale === "pt" ? "Ver no site" : "View on the website", href: absolute(siteUrl, path) } : undefined;
      return locale === "pt"
        ? compose("pt", `Publicado: ${title}`, [`Seu conteúdo "${title}" está publicado no site.`, "Qualquer edição futura volta o item a rascunho e exige nova aprovação."], link)
        : compose("en", `Published: ${title}`, [`Your content "${title}" is now published on the website.`, "Any future edit returns the item to draft and requires a new approval."], link);
    }
    case "membership_granted": {
      const project = field(payload, "projectTitle");
      const slug = field(payload, "projectSlug");
      const role = ROLE_LABEL[locale][field(payload, "role")] ?? field(payload, "role");
      const expires = field(payload, "expiresAt").slice(0, 10);
      const link = siteUrl && slug ? { label: locale === "pt" ? "Abrir o projeto" : "Open the project", href: absolute(siteUrl, `/portal/projetos/${slug}`) } : undefined;
      return locale === "pt"
        ? compose("pt", `Você entrou no projeto ${project}`, [`Você passou a integrar o projeto "${project}" como ${role}.`, expires ? `O acesso vale até ${expires}.` : ""], link)
        : compose("en", `You joined the project ${project}`, [`You are now part of the project "${project}" as ${role}.`, expires ? `Access is valid until ${expires}.` : ""], link);
    }
    default:
      return null;
  }
}
