import Link from "next/link";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

const HERO_CONTENT = {
  badge: "Portal não oficial",
  title: "Engenharia Ferroviária",
  subtitle: "e Metroviária · UFSC Joinville",
  description: "O único curso de Santa Catarina. Formando os engenheiros que vão mover o Brasil.",
  primaryButton: "Explorar",
  secondaryButton: "Sobre o curso",
};

export function HeroSection() {
  return (
    <section className="relative flex min-h-[90vh] w-full flex-col items-center justify-center overflow-hidden lg:min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-[#1A1A1A]">
        {/* Placeholder video/texture */}
        <div 
          className="absolute inset-0 bg-[#242424] opacity-30"
          style={{
            backgroundImage: "url('data:image/svg+xml;utf8,<svg width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M0 20 L20 0 Z\" stroke=\"%233A3A3A\" stroke-width=\"1\" fill=\"none\"/></svg>')",
            backgroundSize: "20px 20px"
          }}
        />
        {/* Overlay escuro */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A1A]/60 to-[#1A1A1A]/80" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 text-center lg:px-0 mx-auto max-w-6xl">
        <AnimatedSection delay={0} translateY="translate-y-[30px]">
          <span className="mb-6 inline-block rounded-full border border-[#3A3A3A] bg-[#2E2E2E] px-4 py-1.5 text-sm font-medium text-[#A0A0A0]">
            {HERO_CONTENT.badge}
          </span>
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            {HERO_CONTENT.title}
          </h1>
        </AnimatedSection>

        <AnimatedSection delay={150} translateY="translate-y-[30px]">
          <h2 className="mb-8 text-2xl font-semibold tracking-tight text-[#A0A0A0] sm:text-3xl md:text-4xl">
            {HERO_CONTENT.subtitle}
          </h2>
        </AnimatedSection>

        <AnimatedSection delay={300} translateY="translate-y-[30px]">
          <p className="mx-auto mb-10 max-w-2xl text-lg text-[#A0A0A0] sm:text-xl">
            {HERO_CONTENT.description}
          </p>
        </AnimatedSection>
        
        <AnimatedSection delay={450} translateY="translate-y-[30px]">
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <Link
              href="#curso"
              className="flex min-h-[44px] items-center justify-center rounded-md bg-[#E84E1B] px-8 py-3.5 text-base font-semibold text-white transition-all hover:-translate-y-[1px] hover:brightness-110 active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E84E1B]"
            >
              {HERO_CONTENT.primaryButton}
            </Link>
            <Link
              href="/sobre"
              className="flex min-h-[44px] items-center justify-center rounded-md border border-white bg-transparent px-8 py-3.5 text-base font-semibold text-white transition-all hover:-translate-y-[1px] hover:brightness-110 active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {HERO_CONTENT.secondaryButton}
            </Link>
          </div>
        </AnimatedSection>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="h-6 w-6 text-[#A0A0A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
