/**
 * Projetos agrupados por categoria (DESIGN-D), na ordem em que cada categoria aparece primeiro na
 * lista da coordenação (`listPublicProjects` já vem nessa ordem). Nada é reordenado dentro do grupo.
 */
export function groupByCategory<T extends { category: string }>(projects: T[]): Array<{ category: string; items: T[] }> {
  const groups = new Map<string, T[]>();
  for (const p of projects) groups.set(p.category, [...(groups.get(p.category) ?? []), p]);
  return [...groups].map(([category, items]) => ({ category, items }));
}
