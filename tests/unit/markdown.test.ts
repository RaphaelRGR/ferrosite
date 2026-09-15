import { describe, expect, it } from "vitest";
import { markdownToText, renderMarkdown } from "@/lib/content/markdown";

/** PUB-001 (18): Markdown restrito — nada de HTML passa; links só http(s)/mailto. */
describe("renderMarkdown", () => {
  it("renderiza parágrafos, títulos, listas, citação e ênfases", () => {
    const html = renderMarkdown("## Título\n\nTexto **forte** e _leve_ com `código`.\n\n- um\n- dois\n\n1. a\n2. b\n\n> citação");
    expect(html).toContain("<h2>Título</h2>");
    expect(html).toContain("<p>Texto <strong>forte</strong> e <em>leve</em> com <code>código</code>.</p>");
    expect(html).toContain("<ul><li>um</li><li>dois</li></ul>");
    expect(html).toContain("<ol><li>a</li><li>b</li></ol>");
    expect(html).toContain("<blockquote><p>citação</p></blockquote>");
  });

  it("escapa todo HTML e não executa scripts/atributos", () => {
    const html = renderMarkdown('<script>alert(1)</script> <img src=x onerror=alert(1)> **<b>x</b>**');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("<strong>&lt;b&gt;x&lt;/b&gt;</strong>");
  });

  it("links: só http(s)/mailto; javascript:/data: viram texto; href escapado", () => {
    expect(renderMarkdown("[ok](https://ufsc.br/a?b=1&c=2)")).toBe('<p><a href="https://ufsc.br/a?b=1&amp;c=2" rel="noopener noreferrer">ok</a></p>');
    expect(renderMarkdown("[mail](mailto:x@y.z)")).toContain('href="mailto:x@y.z"');
    expect(renderMarkdown("[bad](javascript:alert(1))")).not.toContain("<a");
    expect(renderMarkdown("[bad](JAVASCRIPT:alert(1))")).not.toContain("href");
    expect(renderMarkdown("[bad](data:text/html;base64,AAAA)")).toBe("<p>bad</p>");
    expect(renderMarkdown('[q](https://a.b/"onmouseover="x)')).toContain('href="https://a.b/&quot;onmouseover=&quot;x"');
  });

  it("quebra de linha dentro do parágrafo vira <br />; h1 e h4+ não existem no subconjunto", () => {
    expect(renderMarkdown("a\nb")).toBe("<p>a<br />b</p>");
    expect(renderMarkdown("# não\n#### nem")).toBe("<p># não<br />#### nem</p>");
  });

  it("markdownToText remove marcação", () => {
    expect(markdownToText("## T\n\n**a** _b_ [c](https://x) `d`")).toBe("T a b c d");
  });
});
