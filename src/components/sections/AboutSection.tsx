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
    <section id="curso" className="bg-[#0A0A0A] py-24 lg:py-40">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <AnimatedSection translateY="translate-y-16">
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-white/10">
              <Image
                src={ABOUT_CONTENT.imageSrc}
                alt={ABOUT_CONTENT.imageAlt}
                fill
                unoptimized
                className="object-cover transition-transform duration-700 hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent opacity-60" />
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
              href="/sobre"
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
