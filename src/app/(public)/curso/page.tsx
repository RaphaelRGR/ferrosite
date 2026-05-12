import { Metadata } from "next";
import { CursoHero } from "@/components/sections/CursoHero";
import { CoursePillars } from "@/components/sections/CoursePillars";
import { CourseCrea } from "@/components/sections/CourseCrea";
import { CurriculumFlowchart } from "@/components/ui/CurriculumFlowchart";

export const metadata: Metadata = {
  title: "Curso | FerroSite",
  description: "Conheça o único curso de Engenharia Ferroviária e Metroviária do Brasil projetado do zero. Matriz curricular interativa, abrangências e CREA Mecânica.",
};

export default function CursoPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <CursoHero />
      <CoursePillars />
      <CourseCrea />
      <CurriculumFlowchart />
    </main>
  );
}
