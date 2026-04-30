import { AnimatedSection } from "@/components/ui/AnimatedSection";

const COMPANIES_CONTENT = {
  title: "Onde nossos engenheiros trabalham",
  subtitle: "As principais concessionárias e operadoras ferroviárias do Brasil",
};

const COMPANIES = [
  { id: 1, name: "RUMO" },
  { id: 2, name: "MRS Logística" },
  { id: 3, name: "VLI" },
  { id: 4, name: "Vale" },
  { id: 5, name: "ANPTrilhos" },
];

export function CompaniesSection() {
  return (
    <section className="bg-[#1A1A1A] py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-8 lg:px-0">
        <AnimatedSection>
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {COMPANIES_CONTENT.title}
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#A0A0A0]">
              {COMPANIES_CONTENT.subtitle}
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-8">
            {COMPANIES.map((company) => (
              <div
                key={company.id}
                className="flex min-h-[80px] items-center justify-center rounded-lg border border-[#3A3A3A] bg-[#2E2E2E] p-6 text-center text-lg font-bold text-[#A0A0A0] transition-all duration-150 ease-in-out hover:border-[#E84E1B] hover:text-white sm:text-xl"
              >
                {/* TODO: substituir por logos reais com next/image */}
                {company.name}
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
