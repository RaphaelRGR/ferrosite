import Link from "next/link";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

const CTA_CONTENT = {
  title: "Acesse o Portal",
  description: "Acervo de normas, banco de questões e projetos da AFER. Aberto para alunos e interessados no setor ferroviário.",
  buttonLabel: "Entrar no Portal →",
  buttonHref: "/portal",
};

export function CtaSection() {
  return (
    <section className="bg-[#E84E1B] py-16 sm:py-24 lg:py-32">
      <AnimatedSection className="mx-auto max-w-6xl px-4 sm:px-8 lg:px-0 lg:flex lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {CTA_CONTENT.title}
          </h2>
          <p className="mt-4 text-lg leading-8 text-white/90 sm:mt-6">
            {CTA_CONTENT.description}
          </p>
        </div>
        <div className="mt-8 flex items-center lg:mt-0 lg:shrink-0">
          <Link
            href={CTA_CONTENT.buttonHref}
            className="flex min-h-[44px] w-full items-center justify-center rounded-md bg-white px-8 py-3.5 text-base font-bold text-[#E84E1B] shadow-sm transition-all hover:-translate-y-[1px] hover:brightness-110 active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
          >
            {CTA_CONTENT.buttonLabel}
          </Link>
        </div>
      </AnimatedSection>
    </section>
  );
}
