/**
 * Markdown restrito → HTML (18: "Markdown/rich text é sanitizado e links têm allowlist").
 * Estratégia: nunca deixar HTML passar (tudo é escapado) e só produzir as tags
 * que o subconjunto suporta: parágrafos, títulos (##/###), listas (-, 1.),
 * citação (>), negrito (**), itálico (_), código inline (`) e links [t](url)
 * apenas http(s)/mailto. Sem dependência externa: superfície pequena e testável.
 */
const ALLOWED_PROTOCOLS = /^(https?:\/\/|mailto:)/i;

export function escapeHtml(input: string): string {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function inline(text: string): string {
  let out = escapeHtml(text);
  // código inline antes de ênfases, para não interpretar * e _ dentro dele
  out = out.replace(/`([^`\n]+)`/g, (_m, code: string) => `<code>${code}</code>`);
  // links: texto e URL já escapados; só protocolos da allowlist viram <a>
  out = out.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (_m, label: string, url: string) => {
    // o texto já foi escapado: desfaz para validar a URL e escapa de novo no atributo
    const href = url.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    if (!ALLOWED_PROTOCOLS.test(href)) return label;
    return `<a href="${escapeHtml(href)}" rel="noopener noreferrer">${label}</a>`;
  });
  out = out.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[\s(])_([^_\n]+)_(?=[\s.,;:!?)]|$)/g, "$1<em>$2</em>");
  return out;
}

export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const html: string[] = [];
  let paragraph: string[] = [];
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;
  let quote: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) html.push(`<p>${paragraph.map(inline).join("<br />")}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (list) html.push(`<${list.kind}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.kind}>`);
    list = null;
  };
  const flushQuote = () => {
    if (quote.length) html.push(`<blockquote><p>${quote.map(inline).join("<br />")}</p></blockquote>`);
    quote = [];
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushAll();
      continue;
    }
    const heading = /^(#{2,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushAll();
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }
    const ul = /^\s*[-*]\s+(.+)$/.exec(line);
    const ol = /^\s*\d+[.)]\s+(.+)$/.exec(line);
    if (ul || ol) {
      flushParagraph();
      flushQuote();
      const kind = ul ? "ul" : "ol";
      if (!list || list.kind !== kind) {
        flushList();
        list = { kind, items: [] };
      }
      list.items.push((ul ?? ol)![1]);
      continue;
    }
    const q = /^>\s?(.*)$/.exec(line);
    if (q) {
      flushParagraph();
      flushList();
      quote.push(q[1]);
      continue;
    }
    flushList();
    flushQuote();
    paragraph.push(line.trim());
  }
  flushAll();
  return html.join("\n");
}

/** Texto simples (sem marcação) para resumos/metadados. */
export function markdownToText(md: string): string {
  return md
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_>#]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
