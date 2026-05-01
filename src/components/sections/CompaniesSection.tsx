import { AnimatedSection } from "@/components/ui/AnimatedSection";

const COMPANIES = ["RUMO", "MRS", "VLI", "VALE", "ANPTrilhos"];

export function CompaniesSection() {
  return (
    <section className="bg-[#0A0A0A] py-20 md:py-28 border-t border-[#2E2E2E]">
      <div className="mx-auto max-w-6xl px-6">
        {/* TODO: substituir texto por logo real com next/image */}
        <AnimatedSection className="flex flex-wrap items-center justify-center gap-3">
          {COMPANIES.map((name) => (
            <div 
              key={name} 
              className="bg-[#2E2E2E] border border-[#3A3A3A] rounded-[6px] px-6 py-3 text-white font-medium text-sm transition-all duration-150 hover:border-[#E84E1B] hover:text-[#E84E1B] cursor-default"
            >
              {name}
            </div>
          ))}
        </AnimatedSection>
        <p className="text-center mt-12 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
          Empresas parceiras e destinos de egressos
        </p>
      </div>
    </section>
  );
}
