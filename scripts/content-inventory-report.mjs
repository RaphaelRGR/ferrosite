// Gera docs/content/inventario-editorial.md a partir de content/editorial-inventory.json.
// Uso: npm run content:report
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const inventory = JSON.parse(readFileSync(path.join(root, "content/editorial-inventory.json"), "utf8"));

const esc = (v) => String(v ?? "—").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
const entries = inventory.sections.flatMap((s) => s.entries.map((e) => ({ ...e, section: s })));
const count = (pred) => entries.filter(pred).length;
const byStatus = (st) => count((e) => (e.status ?? "UNVERIFIED") === st);
const byKind = Object.entries(
  entries.reduce((acc, e) => ((acc[e.kind] = (acc[e.kind] ?? 0) + 1), acc), {}),
).sort((a, b) => b[1] - a[1]);

let md = `# Inventário editorial (quarentena BASE-002)

Gerado de \`content/editorial-inventory.json\` em ${new Date().toISOString().slice(0, 10)} — não editar à mão; edite o JSON e rode \`npm run content:report\`.

Política: nada abaixo é publicado como fato. Em modo \`review\` (default) o site exibe o conteúdo com o selo **"Conteúdo em verificação"**; em \`strict\` (\`NEXT_PUBLIC_CONTENT_MODE=strict\`) o conteúdo não verificado não é renderizado. Uma entrada só deixa a quarentena com \`status: VERIFIED\`, \`source\`, \`owner\`, \`verified_at\` e \`decision: confirmar\`.

## Resumo

| Total | UNVERIFIED | VERIFIED | DISCARDED | Seções |
|---|---|---|---|---|
| ${entries.length} | ${byStatus("UNVERIFIED")} | ${byStatus("VERIFIED")} | ${byStatus("DISCARDED")} | ${inventory.sections.length} |

Por tipo: ${byKind.map(([k, n]) => `${k} ${n}`).join(" · ")}

## Decisões pendentes (owner humano)

Para cada linha: **confirmar** (com fonte primária e responsável), **corrigir** (novo valor + fonte) ou **descartar**.

`;

for (const section of inventory.sections) {
  md += `### ${section.title} — \`${section.id}\`\n\nRota: \`${section.route}\` · Código: \`${section.component}\`\n\n`;
  md += `| content_id | tipo | valor (PT) | fonte | owner | status | verified_at | decisão | notas |\n|---|---|---|---|---|---|---|---|---|\n`;
  for (const e of section.entries) {
    md += `| \`${e.content_id}\` | ${e.kind} | ${esc(e.value_pt)} | ${esc(e.source)} | ${esc(e.owner)} | ${e.status ?? "UNVERIFIED"} | ${esc(e.verified_at)} | ${esc(e.decision)} | ${esc(e.notes)} |\n`;
  }
  md += "\n";
}

mkdirSync(path.join(root, "docs/content"), { recursive: true });
writeFileSync(path.join(root, "docs/content/inventario-editorial.md"), md);
console.log(`docs/content/inventario-editorial.md: ${entries.length} entradas em ${inventory.sections.length} seções`);
