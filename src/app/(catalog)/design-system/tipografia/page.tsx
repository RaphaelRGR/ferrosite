import type { Metadata } from "next";
import localFont from "next/font/local";
import curriculum from "../../../../../content/curriculum/2025.json";
import { getDictionary } from "@/i18n/dictionaries";
import { formatEventRange, monthMatrix, monthName, weekdayNames } from "@/lib/calendar/rail";
import { listPublicRailEvents, listPublished } from "@/lib/content/public";

export const metadata: Metadata = {
  title: "Teste tipográfico",
  description: "Comparativo de fontes candidatas do site público (DESIGN-D), com conteúdo real.",
  robots: { index: false, follow: false },
};

// Candidatas do DESIGN-D, servidas do próprio projeto (src/fonts, OFL; latin cobre o português).
// Carregadas só nesta página de teste; nada aqui muda o site ou o Portal.
const archivo = localFont({ src: "../../../../fonts/archivo/archivo-latin-standard-normal.woff2", weight: "100 900", style: "normal", display: "swap" });
const barlow = localFont({
  src: [
    { path: "../../../../fonts/barlow/barlow-latin-400-normal.woff2", weight: "400" },
    { path: "../../../../fonts/barlow/barlow-latin-500-normal.woff2", weight: "500" },
    { path: "../../../../fonts/barlow/barlow-latin-700-normal.woff2", weight: "700" },
  ],
  display: "swap",
});
const barlowCondensed = localFont({
  src: [
    { path: "../../../../fonts/barlow/barlow-condensed-latin-600-normal.woff2", weight: "600" },
    { path: "../../../../fonts/barlow/barlow-condensed-latin-700-normal.woff2", weight: "700" },
    { path: "../../../../fonts/barlow/barlow-condensed-latin-800-normal.woff2", weight: "800" },
  ],
  display: "swap",
});
// Geist: a do site hoje, já carregada pelo HtmlShell (font-sans).
const geist = { className: "font-sans" };

type Candidate = {
  id: string;
  name: string;
  note: string;
  text: string;
  display: string;
  displayStyle?: React.CSSProperties;
};

const CANDIDATES: Candidate[] = [
  {
    id: "archivo",
    name: "Archivo (variável, largura 80 nos títulos)",
    note: "Uma família só: condensada e pesada nos títulos, largura normal no texto.",
    text: archivo.className,
    display: archivo.className,
    displayStyle: { fontVariationSettings: '"wdth" 80', fontWeight: 800, letterSpacing: "-0.01em", wordSpacing: "0.04em" },
  },
  {
    id: "barlow",
    name: "Barlow + Barlow Condensed",
    note: "Desenho derivado da sinalização rodoviária; duas famílias da mesma superfamília.",
    text: barlow.className,
    display: barlowCondensed.className,
    displayStyle: { fontWeight: 700, letterSpacing: "-0.005em" },
  },
  {
    id: "geist",
    name: "Geist (atual, controle)",
    note: "A fonte de hoje, para comparar.",
    text: geist.className,
    display: geist.className,
    displayStyle: { fontWeight: 900, letterSpacing: "-0.025em" },
  },
];

/**
 * Teste tipográfico do DESIGN-D: as mesmas peças reais do site (título da Home, texto de uma
 * experiência publicada, datas do calendário, um mês, uma disciplina do fluxograma) em cada fonte.
 */
export default async function TypeSpecimenPage() {
  const dict = getDictionary("pt");
  const [experiences, events] = await Promise.all([listPublished("experience", "pt", 1), listPublicRailEvents()]);
  const exp = experiences[0];
  const paragraph = exp?.body_md.split(/\n\s*\n/).find((p) => p.trim().length > 200)?.replace(/[*_#>]/g, "").trim() ?? dict.home.hero.description;
  const subject = curriculum.phases[2].subjects[1];
  const hero = dict.home.hero;
  const year = events[0] ? Number(events[0].starts_on.slice(0, 4)) : new Date().getFullYear();
  const sept = monthMatrix(year, 9);
  const septDays = new Set(events.filter((e) => e.starts_on.slice(5, 7) === "09").flatMap((e) => {
    const out: string[] = [];
    for (let d = new Date(`${e.starts_on}T12:00:00Z`); d <= new Date(`${e.ends_on ?? e.starts_on}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) out.push(d.toISOString().slice(0, 10));
    return out;
  }));

  return (
    <div className="flex flex-col gap-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-black">Teste tipográfico · DESIGN-D</h1>
        <p className="max-w-3xl text-fg-muted">
          Mesmo conteúdo real em cada candidata. Critérios: leitura de texto longo, números alinhados (tabular), títulos condensados no celular (coluna estreita à direita) e acentuação.
        </p>
      </header>

      {CANDIDATES.map((c) => (
        <section key={c.id} id={c.id} aria-labelledby={`${c.id}-h`} className="flex flex-col gap-8 rounded-2xl bg-surface p-6 sm:p-10">
          <div className="flex flex-col gap-1">
            <h2 id={`${c.id}-h`} className="text-sm font-bold text-link">{c.name}</h2>
            <p className="text-sm text-fg-muted">{c.note}</p>
          </div>

          <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1fr)_390px]">
            {/* desktop */}
            <div className="flex min-w-0 flex-col gap-6">
              <p className={`${c.display} leading-[0.95]`} style={{ ...c.displayStyle, fontSize: "clamp(3rem, 6.5vw, 6rem)" }}>
                {hero.title.replace(" & ", " e ")}
              </p>
              <p className={`${c.text} text-xl font-medium`}>{hero.subtitle} · {hero.description}</p>
              <p className={`${c.display} text-4xl leading-tight`} style={c.displayStyle}>
                Próximos eventos do setor ferroviário
              </p>
              <p className={`${c.text} max-w-[68ch] text-[17px] leading-[1.6] [text-wrap:pretty]`}>{paragraph}</p>
            </div>

            {/* celular: coluna de 390 px */}
            <div className="flex flex-col gap-4 rounded-xl bg-canvas p-4" style={{ width: "100%", maxWidth: 390 }}>
              <span className="text-xs text-fg-muted">Coluna de 390 px</span>
              <p className={`${c.display} leading-[0.95]`} style={{ ...c.displayStyle, fontSize: "2.75rem" }}>
                {hero.title.replace(" & ", " e ")}
              </p>
              <p className={`${c.text} text-base leading-[1.55]`}>{hero.description}</p>
              <p className={`${c.text} text-[15px] leading-[1.55]`}>Ação, missões, ç ã õ é í ú â ê ô · Joinville · São Paulo · InnoTrans</p>
            </div>
          </div>

          <div className="grid min-w-0 gap-10 lg:grid-cols-2">
            {/* tabela de datas reais do calendário */}
            <div className="min-w-0 overflow-x-auto">
            <table className={`${c.text} w-full min-w-0 text-left text-[15px] tabular-nums`}>
              <caption className="pb-2 text-left text-xs text-fg-muted">Calendário {year} (tabular-nums)</caption>
              <tbody>
                {events.slice(0, 6).map((e) => (
                  <tr key={e.id} className="border-t border-line">
                    <td className="whitespace-nowrap py-2 pr-4 font-bold">{formatEventRange("pt", e.starts_on, e.ends_on)}</td>
                    <td className="py-2 pr-4">{e.name}</td>
                    <td className="py-2 text-fg-muted">{e.city}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            <div className="flex flex-col gap-6">
              {/* um mês do calendário */}
              <div className={`${c.text} max-w-xs`}>
                <p className={`${c.display} text-2xl`} style={c.displayStyle}>{monthName("pt", 9)}</p>
                <table className="mt-2 w-full table-fixed text-center text-sm tabular-nums">
                  <thead>
                    <tr>{weekdayNames("pt").map((w, i) => <th key={i} className="pb-1 text-[11px] font-bold text-fg-muted">{w.charAt(0).toUpperCase()}</th>)}</tr>
                  </thead>
                  <tbody>
                    {sept.map((week, wi) => (
                      <tr key={wi}>
                        {week.map((d, di) => (
                          <td key={di} className="p-0.5">
                            {d && <span className={`flex h-7 items-center justify-center rounded-full ${septDays.has(d) ? "bg-action font-bold text-fg-on-action" : ""}`}>{Number(d.slice(8))}</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* disciplina do fluxograma */}
              <div className={`${c.text} w-56 rounded-xl border border-line bg-canvas p-3`}>
                <p className="text-[11px] font-bold text-fg-muted tabular-nums">{subject.id} · {subject.hours} h</p>
                <p className="mt-1 text-sm font-bold leading-snug">{subject.name}</p>
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
