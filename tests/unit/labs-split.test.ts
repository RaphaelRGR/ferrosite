import { describe, expect, it } from "vitest";
import { LABS, splitAbout } from "@/content/labs";

describe("ficha técnica do laboratório (DESIGN-D)", () => {
  it("separa infraestrutura/equipamentos sem perder nem reescrever frases", () => {
    for (const lab of LABS) {
      const { infrastructure, about } = splitAbout(lab);
      expect([...infrastructure, ...about].sort()).toEqual([...lab.about].sort());
    }
  });
  it("reconhece 'Equipamentos:' e 'Infraestrutura …' do portfólio", () => {
    const r = splitAbout({ about: ["Pesquisa em fadiga.", "Equipamentos: extensômetros.", "Infraestrutura composta por túnel de vento."] });
    expect(r.infrastructure).toEqual(["Equipamentos: extensômetros.", "Infraestrutura composta por túnel de vento."]);
    expect(r.about).toEqual(["Pesquisa em fadiga."]);
  });
  it("ao menos metade dos laboratórios detalhados tem frase de infraestrutura no portfólio", () => {
    const detailed = LABS.filter((l) => l.about.length > 0 && !l.duplicateOf);
    expect(detailed.filter((l) => splitAbout(l).infrastructure.length > 0).length).toBeGreaterThanOrEqual(Math.ceil(detailed.length / 2));
  });
});
