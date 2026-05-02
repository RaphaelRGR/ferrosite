import Image from "next/image";
import Link from "next/link";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

const ABOUT_CONTENT = {
  title: "A Engenharia que move o país",
  subtitle: "O único curso de Santa Catarina.",
  description: "Formamos profissionais para projetar, construir e operar os sistemas que são a espinha dorsal da logística nacional. O curso de Engenharia Ferroviária e Metroviária da UFSC Joinville é referência técnica e inovação no setor.",
  buttonLabel: "Conhecer o curso",
  imageSrc: "https://placehold.co/800x600/0A0A0A/FFFFFF.png",
  imageAlt: "Engenharia Ferroviária UFSC",
};

export function AboutSection() {
  return (
    <section id="curso" className="bg-[#0A0A0A] py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <AnimatedSection translateY="translate-y-16">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-[#3A3A3A] bg-[#1A1A1A] flex items-center justify-center">
              {/* Textura SVG de trilhos */}
              <div className="absolute inset-0 opacity-[0.08]">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="rail-texture" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <line x1="0" y1="20" x2="40" y2="20" stroke="white" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#rail-texture)" />
                </svg>
              </div>
              <span className="font-mono text-sm text-[#E84E1B] opacity-50 relative z-10">
                [ foto em breve ]
              </span>
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={200} translateY="translate-y-16">
            <span className="text-[#E84E1B] font-bold tracking-widest uppercase text-xs mb-4 block">
              {ABOUT_CONTENT.subtitle}
            </span>
            <h2 className="mb-8 text-4xl font-black tracking-tighter text-white sm:text-5xl lg:text-6xl">
              {ABOUT_CONTENT.title}
            </h2>
            <p className="mb-10 text-xl leading-relaxed text-white/60">
              {ABOUT_CONTENT.description}
            </p>
            <Link
              href="/curso"
              className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-white px-10 text-base font-bold text-black transition-all hover:bg-[#E84E1B] hover:text-white"
            >
              {ABOUT_CONTENT.buttonLabel}
            </Link>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
