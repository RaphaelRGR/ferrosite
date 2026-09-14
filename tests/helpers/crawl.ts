import type { APIRequestContext, Page } from "@playwright/test";

export interface LinkInventory {
  /** rota -> hrefs internos encontrados (ordenados, sem duplicatas) */
  byRoute: Record<string, string[]>;
  /** caminhos internos que não respondem < 400 */
  brokenPaths: string[];
  /** "rota#fragmento" cujo alvo não existe na página de destino */
  brokenFragments: string[];
}

function isInternal(href: string): boolean {
  return href.startsWith("/") || href.startsWith("#");
}

/** Resolve href relativo à rota atual, mantendo apenas path + hash. */
function resolveHref(route: string, href: string): { path: string; hash: string } {
  const url = new URL(href, `http://placeholder.local${route}`);
  return { path: url.pathname, hash: url.hash.replace(/^#/, "") };
}

/**
 * Percorre as rotas, coleta `a[href]` internos, verifica status de cada caminho
 * e a existência de cada fragmento (`#id` ou `[name]`) na página de destino.
 */
export async function crawlInternalLinks(
  page: Page,
  request: APIRequestContext,
  routes: readonly string[],
): Promise<LinkInventory> {
  const byRoute: Record<string, string[]> = {};
  const pathStatus = new Map<string, number>();
  const fragmentsToCheck = new Map<string, Set<string>>(); // path -> ids

  for (const route of routes) {
    await page.goto(route, { waitUntil: "load" });
    const hrefs = await page.$$eval("a[href]", (els) =>
      els.map((el) => el.getAttribute("href") ?? "").filter(Boolean),
    );
    const internal = [...new Set(hrefs.filter(isInternal))].sort();
    byRoute[route] = internal;

    for (const href of internal) {
      const { path, hash } = resolveHref(route, href);
      if (!pathStatus.has(path)) {
        const res = await request.get(path, { maxRedirects: 5 });
        pathStatus.set(path, res.status());
      }
      if (hash) {
        if (!fragmentsToCheck.has(path)) fragmentsToCheck.set(path, new Set());
        fragmentsToCheck.get(path)!.add(hash);
      }
    }
  }

  const brokenPaths = [...pathStatus.entries()]
    .filter(([, status]) => status >= 400)
    .map(([path]) => path)
    .sort();

  const brokenFragments: string[] = [];
  for (const [path, ids] of fragmentsToCheck) {
    if ((pathStatus.get(path) ?? 500) >= 400) continue; // já contado como caminho quebrado
    await page.goto(path, { waitUntil: "load" });
    for (const id of ids) {
      const exists = await page.evaluate(
        (fragment) => !!(document.getElementById(fragment) || document.getElementsByName(fragment).length),
        id,
      );
      if (!exists) brokenFragments.push(`${path}#${id}`);
    }
  }
  brokenFragments.sort();

  return { byRoute, brokenPaths, brokenFragments };
}
