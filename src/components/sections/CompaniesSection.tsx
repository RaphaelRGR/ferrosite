import { AnimatedSection } from "@/components/ui/AnimatedSection";

const COMPANIES = ["RUMO", "MRS", "VLI", "VALE", "ANPTrilhos"];

export function CompaniesSection() {
  return (
    <section className="bg-white py-24 border-y border-orange-500/10">
      <div className="mx-auto max-w-6xl px-6">
        <AnimatedSection className="flex flex-wrap items-center justify-center gap-12 md:gap-24 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
          {COMPANIES.map((name) => (
            <span key={name} className="text-2xl md:text-3xl font-black tracking-tighter text-[#E84E1B]">
              {name}
            </span>
          ))}
        </AnimatedSection>
        <p className="text-center mt-12 text-[10px] font-black uppercase tracking-[0.2em] text-[#E84E1B]/30">
          Empresas parceiras e destinos de egressos
        </p>
      </div>
    </section>
  );
}
