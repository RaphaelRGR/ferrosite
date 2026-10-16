#!/usr/bin/env node
// Screenshots de página inteira (1440 e 390 px) + LCP/CLS das páginas principais do site público,
// para o antes/depois de um redesign (DESIGN-D). Só lê páginas públicas; não faz login.
//
//   node scripts/screens.mjs --base https://engferroviaria.vercel.app --out docs/baseline/DESIGN-D/antes
//   node scripts/screens.mjs --base http://localhost:3100 --out docs/baseline/DESIGN-D/depois --only home-pt,curso
//   --metrics-only: só LCP/CLS (sem screenshot), repetido --runs N vezes (mediana no relatório)
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]?.startsWith("--") ? "1" : all[i + 1] ?? "1"]] : acc), []),
);
const base = (args.base ?? "http://localhost:3100").replace(/\/$/, "");
const out = args.out ?? "docs/baseline/DESIGN-D/screens";
const only = args.only ? new Set(args.only.split(",")) : null;
const widths = (args.widths ?? "1440,390").split(",").map(Number);
const metricsOnly = Boolean(args["metrics-only"]);
const runs = Number(args.runs ?? 1);

/** Páginas comparadas. `calendarView` grava a preferência da visão do calendário antes de abrir. */
const PAGES = [
  { id: "home-pt", path: "/pt" },
  { id: "home-en", path: "/en" },
  { id: "curso", path: "/pt/curso" },
  { id: "curso-lista", path: "/pt/curso?vista=lista" },
  { id: "projetos", path: "/pt/projetos" },
  { id: "projeto", path: "/pt/projetos/comunica-ferro" },
  { id: "experiencias", path: "/pt/experiencias" },
  { id: "experiencia", path: "/pt/experiencias/visita-tecnica-rumo-logistica-araucaria-2026" },
  { id: "calendario-lista", path: "/pt/calendario", calendarView: "list" },
  { id: "calendario-grade", path: "/pt/calendario", calendarView: "grid" },
  { id: "noticias", path: "/pt/noticias" },
  { id: "para-empresas", path: "/pt/para-empresas" },
  { id: "laboratorios", path: "/pt/laboratorios" },
  { id: "laboratorio", path: "/pt/laboratorios/lmse" },
  { id: "sobre", path: "/pt/sobre" },
  { id: "login", path: "/login" },
];

// LCP e CLS pelo PerformanceObserver (mesma definição do web-vitals, sem dependência).
const VITALS = () => {
  window.__vitals = { lcp: 0, cls: 0 };
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) window.__vitals.lcp = e.startTime;
  }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) if (!e.hadRecentInput) window.__vitals.cls += e.value;
  }).observe({ type: "layout-shift", buffered: true });
};

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const rows = [];
for (const width of widths) {
  const mobile = width < 768;
  for (const page of PAGES.flatMap((pg) => Array.from({ length: metricsOnly ? runs : 1 }, () => pg))) {
    if (only && !only.has(page.id)) continue;
    const ctx = await browser.newContext({ viewport: { width, height: mobile ? 844 : 900 }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
    const p = await ctx.newPage();
    await p.addInitScript(VITALS);
    if (page.calendarView) await p.addInitScript((v) => localStorage.setItem("ferrosite.calendar.view", v), page.calendarView);
    const res = await p.goto(base + page.path, { waitUntil: "load", timeout: 90_000 }).catch((e) => {
      console.log(`${page.id} @${width}: falhou (${e.message.split(/\n/)[0]})`);
      return null;
    });
    if (!res) {
      rows.push({ page: page.id, width, status: 0, error: true });
      await ctx.close();
      continue;
    }
    // LCP antes de rolar: a rolagem carrega imagens preguiçosas maiores, que o observer contaria
    await p.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    await p.waitForTimeout(1000);
    const lcp = await p.evaluate(() => window.__vitals.lcp);
    if (metricsOnly) {
      const v = await p.evaluate(() => window.__vitals);
      rows.push({ page: page.id, width, status: res?.status() ?? 0, lcp_ms: Math.round(lcp), cls: Number(v.cls.toFixed(3)) });
      console.log(`${page.id} @${width}: ${res?.status()} LCP ${Math.round(lcp)}ms CLS ${v.cls.toFixed(3)}`);
      await ctx.close();
      continue;
    }
    // imagens preguiçosas e animações de entrada: rola até o fim e volta antes da captura
    await p.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await p.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    // estado "já rolou a página": as entradas animadas (data-reveal) ficam visíveis, como para quem leu até o fim
    await p.evaluate(() => document.querySelectorAll("[data-reveal], [data-reveal-group]").forEach((el) => el.classList.add("is-in")));
    await p.waitForTimeout(1600);
    const v = await p.evaluate(() => window.__vitals);
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const file = `${page.id}-${width}.jpg`;
    await p.screenshot({ path: join(out, file), fullPage: true, type: "jpeg", quality: 60 });
    rows.push({ page: page.id, width, status: res?.status() ?? 0, lcp_ms: Math.round(lcp), cls: Number(v.cls.toFixed(3)), overflow_px: overflow, file });
    console.log(`${page.id} @${width}: ${res?.status()} LCP ${Math.round(lcp)}ms CLS ${v.cls.toFixed(3)} overflow ${overflow}px`);
    await ctx.close();
  }
}
await browser.close();
// mediana por página/largura (o LCP pela rede varia muito de uma carga para outra)
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const keys = [...new Set(rows.map((r) => `${r.page}@${r.width}`))];
const summary = keys.map((k) => {
  const rs = rows.filter((r) => `${r.page}@${r.width}` === k && !r.error);
  if (rs.length === 0) return { key: k, error: true };
  return { key: k, lcp_ms: median(rs.map((r) => r.lcp_ms)), cls: Math.max(...rs.map((r) => r.cls)) };
});
writeFileSync(join(out, metricsOnly ? "metrics-lcp.json" : "metrics.json"), JSON.stringify({ base, captured_at: new Date().toISOString(), summary, rows }, null, 2));
