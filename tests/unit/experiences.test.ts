import { describe, expect, it } from "vitest";
import { experienceKind } from "@/components/public/experiences/ExperienceCard";
import { composeExperienceTitle, photoAltFromName, splitExperienceTitle } from "@/lib/portal/experiences";

describe("título da experiência (EXP-001)", () => {
  it("o tipo vira o prefixo que o site usa para classificar", () => {
    expect(composeExperienceTitle("visit", "  RUMO Logística   (Araucária) ")).toBe("Visita técnica: RUMO Logística (Araucária)");
    expect(experienceKind(composeExperienceTitle("visit", "X"))).toBe("visit");
    expect(experienceKind(composeExperienceTitle("talk", "VIBTECH"))).toBe("talk");
    expect(experienceKind(composeExperienceTitle("event", "Dia do Ferroviário 2026"))).toBe("event");
  });

  it("desmonta títulos existentes para editar", () => {
    expect(splitExperienceTitle("Visita técnica: Metrô de São Paulo")).toEqual({ kind: "visit", name: "Metrô de São Paulo" });
    expect(splitExperienceTitle("Palestra VIBTECH: componentes")).toEqual({ kind: "talk", name: "VIBTECH: componentes" });
    expect(splitExperienceTitle("Dia do Ferroviário 2025")).toEqual({ kind: "event", name: "Dia do Ferroviário 2025" });
  });
});

describe("descrição da foto a partir do nome do arquivo", () => {
  it("nome descritivo vira frase", () => {
    expect(photoAltFromName("Grupo_com_locomotiva.jpg", "T", 1)).toBe("Grupo com locomotiva");
    expect(photoAltFromName("Rodeiros_na_oficina_02.jpg", "T", 1)).toBe("Rodeiros na oficina");
    expect(photoAltFromName("Selfie_do_grupo_com_locomotiva.jpeg", "T", 1)).toBe("Selfie do grupo com locomotiva");
    expect(photoAltFromName("vagão - pátio (1).png", "T", 1)).toBe("Vagão pátio");
  });

  it("nome de câmera vira título + número", () => {
    const t = "Visita técnica: Ferrovia Tereza Cristina (FTC)";
    expect(photoAltFromName("20260515_113235.jpg", t, 3)).toBe(`${t} (foto 3)`);
    expect(photoAltFromName("IMG_4521.JPG", t, 4)).toBe(`${t} (foto 4)`);
    expect(photoAltFromName("WhatsApp Image 2026-05-15 at 11.32.jpeg", t, 5)).toBe(`${t} (foto 5)`);
    expect(photoAltFromName("2026-05-15 11.32.10.jpg", t, 6)).toBe(`${t} (foto 6)`);
  });
});
