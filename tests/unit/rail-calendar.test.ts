import { describe, expect, it } from "vitest";
import { countryName, editableYears, formatEventRange, groupByMonth, institutionalToday, isPastEvent, monthName, regionOf } from "@/lib/calendar/rail";

describe("calendário ferroviário (CAL-001)", () => {
  it("ano e hoje no fuso do curso (virada do ano às 00h de Brasília, não UTC)", () => {
    expect(institutionalToday(new Date("2027-01-01T02:00:00Z"))).toBe("2026-12-31");
    expect(editableYears(new Date("2027-01-01T02:00:00Z"))).toEqual([2026, 2027]);
    expect(editableYears(new Date("2027-01-01T04:00:00Z"))).toEqual([2027, 2028]);
  });

  it("evento passado considera o último dia", () => {
    expect(isPastEvent({ starts_on: "2026-09-22", ends_on: "2026-09-25" }, "2026-09-24")).toBe(false);
    expect(isPastEvent({ starts_on: "2026-09-22", ends_on: "2026-09-25" }, "2026-09-26")).toBe(true);
    expect(isPastEvent({ starts_on: "2026-03-10", ends_on: null }, "2026-03-10")).toBe(false);
  });

  it("agrupa por mês em ordem", () => {
    const g = groupByMonth([
      { name: "B", starts_on: "2026-09-22" },
      { name: "A", starts_on: "2026-03-01" },
      { name: "C", starts_on: "2026-09-01" },
    ]);
    expect(g.map((x) => [x.month, x.events.map((e) => e.name)])).toEqual([[3, ["A"]], [9, ["C", "B"]]]);
  });

  it("faixa de datas legível, sem travessão", () => {
    expect(formatEventRange("pt", "2026-09-22", "2026-09-25")).toBe("22 a 25 de setembro");
    expect(formatEventRange("pt", "2026-03-10", null)).toBe("10 de março");
    expect(formatEventRange("pt", "2026-09-29", "2026-10-02")).not.toMatch(/—/);
    expect(formatEventRange("en", "2026-09-22", "2026-09-25")).toMatch(/22.25 September/);
    expect(monthName("pt", 3)).toBe("Março");
  });
  it("país por código ISO, no idioma da página; Brasil/mundo derivado", () => {
    expect(countryName("pt", "DE")).toBe("Alemanha");
    expect(countryName("en", "DE")).toBe("Germany");
    expect(countryName("en", "")).toBe("");
    expect(regionOf("BR")).toBe("brasil");
    expect(regionOf("US")).toBe("mundo");
  });
});

describe("grade do mês (calendário)", () => {
  it("monta semanas de domingo a sábado", async () => {
    const { monthMatrix } = await import("@/lib/calendar/rail");
    const sep = monthMatrix(2026, 9); // 1/9/2026 é terça
    expect(sep[0]).toEqual([null, null, "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05"]);
    expect(sep.flat().filter(Boolean)).toHaveLength(30);
    expect(sep.every((w) => w.length === 7)).toBe(true);
    expect(monthMatrix(2026, 2).flat().filter(Boolean)).toHaveLength(28);
  });

  it("eventos por dia e por mês consideram a duração", async () => {
    const { eventsOnDay, eventsInMonth } = await import("@/lib/calendar/rail");
    const ev = [
      { name: "A", starts_on: "2026-09-29", ends_on: "2026-10-02" },
      { name: "B", starts_on: "2026-09-22", ends_on: null },
    ];
    expect(eventsOnDay(ev, "2026-10-01").map((e) => e.name)).toEqual(["A"]);
    expect(eventsOnDay(ev, "2026-09-22").map((e) => e.name)).toEqual(["B"]);
    expect(eventsInMonth(ev, 2026, 10).map((e) => e.name)).toEqual(["A"]);
    expect(eventsInMonth(ev, 2026, 9).map((e) => e.name)).toEqual(["A", "B"]);
  });

  it("dias da semana no idioma da página, começando no domingo", async () => {
    const { weekdayNames } = await import("@/lib/calendar/rail");
    expect(weekdayNames("pt")[0].toLowerCase()).toMatch(/^dom/);
    expect(weekdayNames("en")[0]).toMatch(/^Sun/);
  });
});
