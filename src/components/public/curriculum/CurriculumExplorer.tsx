"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CURRICULUMS, type Subject, type SubjectCategory } from "@/content/curriculums";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { buildGraph, neighborhood, searchSubjects } from "@/lib/curriculum/graph";
import { SubjectDialog } from "./SubjectDialog";

type Labels = Dictionary["flowchart"];
type View = "graph" | "list";

/** Paleta categórica (decorativa: borda superior dos cards; o rótulo textual está na legenda). */
const CAT_COLORS: Record<SubjectCategory, string> = {
  math: "#2563eb", physics: "#16a34a", mech: "#d97706", fluid: "#ca8a04", elec: "#7c3aed", railway: "#0d9488",
  material: "#9a3412", human: "#64748b", design: "#0891b2", comp: "#4f46e5", project: "#db2777", mgmt: "#475569",
};
const CATEGORIES = Object.keys(CAT_COLORS) as SubjectCategory[];
const OPT_COLUMN = "__optatives__";
const ZOOM_STEPS = [0.5, 0.65, 0.8, 1, 1.15, 1.3];

interface Edge {
  key: string;
  d: string;
  kind: "ancestor" | "descendant";
}

/**
 * Explorador do fluxograma (09/FLOW-002): três matrizes, grafo por fase com
 * optativas, seleção persistente (mouse/toque/teclado), ancestrais e
 * dependentes, zoom/ajuste, navegação por fase, lista equivalente, estado na
 * URL e painel acessível. Geometria calculada a partir do layout real
 * (offsets) e recalculada em resize, sem depender de scroll do documento.
 */
export function CurriculumExplorer({ labels, locale }: { labels: Labels; locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const initialYear = Number(params.get("matriz")) || CURRICULUMS[0].year;
  const [year, setYear] = useState(CURRICULUMS.some((c) => c.year === initialYear) ? initialYear : CURRICULUMS[0].year);
  const curriculum = useMemo(() => CURRICULUMS.find((c) => c.year === year) ?? CURRICULUMS[0], [year]);
  const graph = useMemo(() => buildGraph(curriculum), [curriculum]);

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const id = params.get("disciplina");
    return id && graph.byId.has(id) ? id : null;
  });
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [view, setView] = useState<View>(params.get("vista") === "lista" ? "list" : "graph");
  const [zoom, setZoom] = useState(1);
  const [showOptatives, setShowOptatives] = useState(true);
  const [query, setQuery] = useState("");
  const [dialogId, setDialogId] = useState<string | null>(null);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [canvas, setCanvas] = useState({ width: 0, height: 0 });

  const regionRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<string, HTMLButtonElement>());
  const headingId = useId();

  const activeId = selectedId ?? previewId;
  const hood = useMemo(() => (activeId && graph.byId.has(activeId) ? neighborhood(graph, activeId) : null), [activeId, graph]);

  // ─── URL como estado (09): matriz, disciplina e vista ──────────────────────
  useEffect(() => {
    const next = new URLSearchParams(params.toString());
    if (year === CURRICULUMS[0].year) next.delete("matriz");
    else next.set("matriz", String(year));
    if (selectedId) next.set("disciplina", selectedId);
    else next.delete("disciplina");
    if (view === "list") next.set("vista", "lista");
    else next.delete("vista");
    const qs = next.toString();
    if (qs !== params.toString()) router.replace(`${pathname}${qs ? `?${qs}` : ""}#fluxograma`, { scroll: false });
  }, [year, selectedId, view, params, pathname, router]);

  const changeYear = (y: number) => {
    setYear(y);
    setSelectedId(null);
    setPreviewId(null);
    setEdges([]);
  };

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    setPreviewId(null);
  }, []);

  // ─── Geometria das arestas: offsets reais dentro do board, recalculados em resize ──
  const computeEdges = useCallback(() => {
    const board = boardRef.current;
    if (!board) return;
    setCanvas({ width: board.scrollWidth, height: board.scrollHeight });
    if (!hood) {
      setEdges([]);
      return;
    }
    const rect = (id: string) => {
      const el = cardRefs.current.get(id);
      if (!el) return null;
      return { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
    };
    const next: Edge[] = [];
    for (const [from, to, kind] of hood.edges) {
      const a = rect(from);
      const b = rect(to);
      if (!a || !b) continue;
      const x1 = a.x + a.w;
      const y1 = a.y + a.h / 2;
      const x2 = b.x;
      const y2 = b.y + b.h / 2;
      const dx = Math.max(24, Math.abs(x2 - x1) / 2);
      next.push({ key: `${from}->${to}`, kind, d: `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}` });
    }
    setEdges(next);
  }, [hood]);

  useLayoutEffect(() => {
    computeEdges();
  }, [computeEdges, zoom, showOptatives, view, year]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => computeEdges());
    ro.observe(board);
    return () => ro.disconnect();
  }, [computeEdges]);

  // ─── Zoom / ajuste / fase ──────────────────────────────────────────────────
  const fitToWidth = () => {
    const region = regionRef.current;
    const board = boardRef.current;
    if (!region || !board) return;
    const natural = board.scrollWidth * (1 / zoom);
    setZoom(Math.max(0.35, Math.min(1, (region.clientWidth - 8) / natural)));
  };
  const stepZoom = (dir: 1 | -1) => {
    const idx = ZOOM_STEPS.findIndex((z) => z >= zoom - 0.001);
    const nextIdx = Math.min(ZOOM_STEPS.length - 1, Math.max(0, (idx < 0 ? 3 : idx) + dir));
    setZoom(ZOOM_STEPS[nextIdx]);
  };
  const scrollToPhase = (phase: number | string) => {
    const el = boardRef.current?.querySelector<HTMLElement>(`[data-phase="${phase}"]`);
    el?.scrollIntoView({ inline: "start", block: "nearest", behavior: "auto" });
  };

  // ─── Teclado espacial (09): setas entre cards, Enter seleciona, Shift+Enter detalha, Escape limpa ──
  const columns = useMemo(() => {
    const cols: Array<{ key: string; label: string; phase?: number; subjects: Subject[] }> = curriculum.phases.map((p) => ({
      key: String(p.phase),
      label: `${p.phase}ª ${labels.phase.toLowerCase()}`,
      phase: p.phase,
      subjects: p.subjects,
    }));
    if (showOptatives && curriculum.optatives.length) cols.push({ key: OPT_COLUMN, label: labels.optatives, subjects: curriculum.optatives });
    return cols;
  }, [curriculum, showOptatives, labels]);

  const onCardKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, colIndex: number, rowIndex: number, id: string) => {
    const move = (c: number, r: number) => {
      const col = columns[Math.max(0, Math.min(columns.length - 1, c))];
      const target = col.subjects[Math.max(0, Math.min(col.subjects.length - 1, r))];
      cardRefs.current.get(target.id)?.focus();
    };
    switch (e.key) {
      case "ArrowRight": e.preventDefault(); move(colIndex + 1, rowIndex); break;
      case "ArrowLeft": e.preventDefault(); move(colIndex - 1, rowIndex); break;
      case "ArrowDown": e.preventDefault(); move(colIndex, rowIndex + 1); break;
      case "ArrowUp": e.preventDefault(); move(colIndex, rowIndex - 1); break;
      case "Home": e.preventDefault(); move(colIndex, 0); break;
      case "End": e.preventDefault(); move(colIndex, Number.MAX_SAFE_INTEGER); break;
      case "Escape": e.preventDefault(); select(null); break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (e.shiftKey) { select(id); setDialogId(id); } else select(id);
        break;
    }
  };

  const results = useMemo(() => (query ? searchSubjects(curriculum, query).slice(0, 8) : []), [curriculum, query]);
  const summary = hood
    ? labels.summary
        .replace("{name}", `${hood.id} ${graph.byId.get(hood.id)?.shortName ?? ""}`)
        .replace("{ancestors}", String(hood.ancestors.size))
        .replace("{descendants}", String(hood.descendants.size))
    : labels.noSelection;

  const cardState = (id: string): "selected" | "ancestor" | "descendant" | "dimmed" | "idle" => {
    if (!hood) return "idle";
    if (id === hood.id) return "selected";
    if (hood.ancestors.has(id)) return "ancestor";
    if (hood.descendants.has(id)) return "descendant";
    return "dimmed";
  };

  const stateClass: Record<ReturnType<typeof cardState>, string> = {
    idle: "border-line bg-surface hover:border-line-strong",
    selected: "border-action bg-surface ring-2 ring-action ring-offset-2 ring-offset-canvas z-20",
    ancestor: "border-info bg-surface z-10",
    descendant: "border-success bg-surface z-10",
    dimmed: "border-line bg-surface opacity-40",
  };

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 id={headingId} className="text-2xl font-black tracking-tight sm:text-3xl">
          {labels.title}
        </h2>
        <p className="max-w-3xl text-fg-muted">{labels.description}</p>
        {curriculum.prerequisitesSource === "legacy-unverified" && (
          <p className="rounded-lg border border-warning bg-surface px-3 py-2 text-sm text-fg" role="note">
            {labels.legacyPrerequisites}
          </p>
        )}
      </div>

      {/* ─── Barra de ferramentas ─── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 lg:flex-row lg:flex-wrap lg:items-center">
        <fieldset className="flex items-center gap-1 rounded-full border border-line bg-canvas p-1">
          <legend className="sr-only">{labels.curriculum}</legend>
          {CURRICULUMS.map((c) => (
            <label key={c.id} className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-bold focus-within:ring-2 focus-within:ring-focus ${year === c.year ? "bg-action text-fg-on-action" : "text-fg-muted hover:text-fg"}`}>
              <input type="radio" name="matriz" value={c.year} checked={year === c.year} onChange={() => changeYear(c.year)} className="sr-only" />
              {c.name[locale]}
            </label>
          ))}
        </fieldset>

        <fieldset className="flex items-center gap-1 rounded-full border border-line bg-canvas p-1">
          <legend className="sr-only">{labels.view}</legend>
          {(["graph", "list"] as View[]).map((v) => (
            <label key={v} className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-bold focus-within:ring-2 focus-within:ring-focus ${view === v ? "bg-action text-fg-on-action" : "text-fg-muted hover:text-fg"}`}>
              <input type="radio" name="vista" value={v} checked={view === v} onChange={() => setView(v)} className="sr-only" />
              {v === "graph" ? labels.graph : labels.list}
            </label>
          ))}
        </fieldset>

        <label className="relative flex-1 lg:max-w-xs">
          <span className="sr-only">{labels.search}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className="min-h-10 w-full rounded-full border border-line-strong bg-surface px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          />
          {query && (
            <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-xl border border-line bg-surface p-1 shadow-lg">
              {results.length === 0 && <li className="px-3 py-2 text-sm text-fg-muted">{labels.noResults}</li>}
              {results.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => { select(s.id); setQuery(""); cardRefs.current.get(s.id)?.scrollIntoView({ block: "nearest", inline: "center" }); }}
                    className="flex w-full items-baseline gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    <span className="font-mono text-xs text-fg-muted">{s.id}</span> {s.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </label>

        {view === "graph" && (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => stepZoom(-1)} aria-label={labels.zoomOut} className={toolBtn}>−</button>
            <button type="button" onClick={() => stepZoom(1)} aria-label={labels.zoomIn} className={toolBtn}>+</button>
            <button type="button" onClick={fitToWidth} className={toolBtn}>{labels.fit}</button>
            <button type="button" onClick={() => setZoom(1)} className={toolBtn}>{labels.reset}</button>
            <label className="ml-2 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showOptatives} onChange={(e) => setShowOptatives(e.target.checked)} className="size-4 accent-[var(--action-primary)]" />
              {labels.showOptatives}
            </label>
          </div>
        )}
      </div>

      {/* ─── Seleção atual (anúncio + ações) ─── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="text-sm font-bold">{summary}</p>
        <div className="flex gap-2">
          <button type="button" disabled={!selectedId} onClick={() => selectedId && setDialogId(selectedId)} className={`${toolBtn} disabled:opacity-40`}>
            {labels.details}
          </button>
          <button type="button" disabled={!selectedId} onClick={() => select(null)} className={`${toolBtn} disabled:opacity-40`}>
            {labels.clear}
          </button>
        </div>
      </div>

      {view === "graph" ? (
        <>
          {/* Navegação por fase (útil no toque/mobile) */}
          <nav aria-label={labels.phase} className="flex flex-wrap gap-1">
            {columns.map((col) => (
              <button key={col.key} type="button" onClick={() => scrollToPhase(col.key)} className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-bold text-fg-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                {col.phase ?? col.label}
              </button>
            ))}
          </nav>

          <div
            ref={regionRef}
            role="region"
            aria-label={labels.region}
            tabIndex={0}
            className="overflow-auto rounded-2xl border border-line bg-canvas p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            style={{ maxHeight: "80vh" }}
          >
            <div ref={boardRef} className="relative w-max" style={{ zoom }}>
              <svg aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-[5]" width={canvas.width} height={canvas.height}>
                {edges.map((e) => (
                  <path
                    key={e.key}
                    d={e.d}
                    fill="none"
                    stroke={e.kind === "ancestor" ? "var(--status-info)" : "var(--status-success)"}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    opacity={0.9}
                  />
                ))}
              </svg>
              <div className="grid grid-flow-col gap-4" style={{ gridAutoColumns: "172px" }}>
                {columns.map((col, colIndex) => (
                  <div key={col.key} data-phase={col.key} className="flex flex-col gap-2">
                    <h3 className="sticky top-0 z-[6] rounded-md border border-line bg-surface px-2 py-1 text-center text-[11px] font-bold uppercase tracking-widest text-fg-muted">
                      {col.label}
                    </h3>
                    {col.subjects.map((s, rowIndex) => {
                      const st = cardState(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          ref={(el) => { if (el) cardRefs.current.set(s.id, el); else cardRefs.current.delete(s.id); }}
                          onClick={() => (selectedId === s.id ? setDialogId(s.id) : select(s.id))}
                          onMouseEnter={() => !selectedId && setPreviewId(s.id)}
                          onMouseLeave={() => !selectedId && setPreviewId(null)}
                          onFocus={() => !selectedId && setPreviewId(s.id)}
                          onKeyDown={(e) => onCardKeyDown(e, colIndex, rowIndex, s.id)}
                          aria-pressed={selectedId === s.id}
                          aria-label={`${s.id} ${s.name}, ${s.hours} ${labels.hours}${st === "ancestor" ? `, ${labels.ancestor}` : st === "descendant" ? `, ${labels.descendant}` : ""}`}
                          className={`relative flex min-h-[84px] flex-col gap-1 rounded-lg border p-2.5 text-left text-fg transition-[opacity,border-color] duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${stateClass[st]}`}
                          style={{ borderTopWidth: 4, borderTopColor: CAT_COLORS[s.cat] }}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[10px] font-bold text-fg-muted">{s.id}</span>
                            {s.ext && <span className="rounded bg-action px-1 text-[9px] font-black text-fg-on-action">EXT</span>}
                          </span>
                          <span className="text-[12px] font-bold leading-snug">{s.shortName}</span>
                          <span className="mt-auto text-[10px] font-bold text-fg-muted">{s.hours} {labels.hours}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-fg-muted">{labels.keyboardHelp}</p>
        </>
      ) : (
        <div className="flex flex-col gap-6">
          {columns.map((col) => (
            <section key={col.key} className="rounded-2xl border border-line bg-surface p-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-action">{col.label}</h3>
              <ul className="mt-3 divide-y divide-line">
                {col.subjects.map((s) => {
                  const st = cardState(s.id);
                  return (
                    <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                      <button
                        type="button"
                        onClick={() => (selectedId === s.id ? setDialogId(s.id) : select(s.id))}
                        aria-pressed={selectedId === s.id}
                        className={`rounded text-left font-bold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${st === "selected" ? "text-link" : ""}`}
                      >
                        <span className="font-mono text-xs text-fg-muted">{s.id}</span> {s.name}
                      </button>
                      <span className="text-xs text-fg-muted">{s.hours} {labels.hours} · {labels.categories[s.cat]}</span>
                      {(s.pre.length > 0 || s.preAny.length > 0) && (
                        <span className="text-xs text-fg-muted">
                          {labels.prerequisites}: {[...s.pre, ...s.preAny.map((g) => `(${g.join(" / ")})`)].join(", ")}
                        </span>
                      )}
                      {st === "ancestor" && <span className="text-xs font-bold text-info">{labels.ancestor}</span>}
                      {st === "descendant" && <span className="text-xs font-bold text-success">{labels.descendant}</span>}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* ─── Legenda ─── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 text-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">{labels.legend}</p>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          <li className="flex items-center gap-2"><span aria-hidden="true" className="h-3 w-6 rounded border-2 border-action" /> {labels.selected}</li>
          <li className="flex items-center gap-2"><span aria-hidden="true" className="h-3 w-6 rounded border-2 border-info" /> {labels.ancestor}</li>
          <li className="flex items-center gap-2"><span aria-hidden="true" className="h-3 w-6 rounded border-2 border-success" /> {labels.descendant}</li>
        </ul>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {CATEGORIES.map((cat) => (
            <li key={cat} className="flex items-center gap-2">
              <span aria-hidden="true" className="size-3 rounded-full" style={{ backgroundColor: CAT_COLORS[cat] }} />
              {labels.categories[cat]}
            </li>
          ))}
        </ul>
        {curriculum.unknownPrerequisites.length > 0 && (
          <p className="text-xs text-fg-muted">
            {labels.unknownPrerequisites} <span className="font-mono">{curriculum.unknownPrerequisites.join(", ")}</span>
          </p>
        )}
        <a href={`/${curriculum.source.file.replace(/^public\//, "")}`} className="w-fit rounded text-sm font-bold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {labels.pdf} · {curriculum.year}
        </a>
      </div>

      <SubjectDialog
        subject={dialogId ? graph.byId.get(dialogId) ?? null : null}
        graph={graph}
        labels={labels}
        onClose={() => setDialogId(null)}
        onSelect={(id) => { select(id); setDialogId(id); }}
      />
    </section>
  );
}

const toolBtn =
  "inline-flex min-h-10 items-center justify-center rounded-full border border-line-strong bg-surface px-4 text-sm font-bold text-fg hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";
