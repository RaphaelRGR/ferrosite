import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { HTML_ROUTES, routeSlug } from "../helpers/routes";

/**
 * Captura de baseline visual das telas atuais (não é comparação pixel a pixel).
 * Viewports definidos em 27_TESTES_E_QUALIDADE.md. As páginas são roladas até o
 * fim antes da captura para disparar IntersectionObserver/ScrollTrigger; o vídeo
 * do hero e animações contínuas ainda podem variar entre execuções.
 *
 * Saída: docs/baseline/screenshots/<rota>__<largura>x<altura>.png
 */
const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
] as const;

const OUT_DIR = path.resolve(process.cwd(), "docs/baseline/screenshots");

test.beforeAll(() => {
  mkdirSync(OUT_DIR, { recursive: true });
});

for (const route of HTML_ROUTES) {
  for (const viewport of VIEWPORTS) {
    test(`${route} @ ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(route, { waitUntil: "load" });

      // Rola em passos de uma viewport para revelar seções animadas por scroll.
      const total = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < total; y += viewport.height) {
        await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" as ScrollBehavior }), y);
        await page.waitForTimeout(150);
      }
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }));
      await page.waitForTimeout(800);

      await page.screenshot({
        path: path.join(OUT_DIR, `${routeSlug(route)}__${viewport.width}x${viewport.height}.png`),
        fullPage: true,
        animations: "disabled",
      });
    });
  }
}
