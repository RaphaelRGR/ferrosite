import Image from "next/image";
import Link from "next/link";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

const ABOUT_CONTENT = {
  title: "Quem somos",
  description: "O curso de Engenharia Ferroviária e Metroviária do CTJ — Centro Tecnológico de Joinville da UFSC — forma profissionais para projetar, construir e operar sistemas ferroviários e metroviários. Único em Santa Catarina, com parceria com o IFMG Santos Dumont (MG), um dos outros dois cursos de graduação em Engenharia Ferroviária do Brasil.",
  buttonLabel: "Conhecer o curso →",
  buttonHref: "/sobre",
  imageSrc: "https://placehold.co/600x400/2E2E2E/FFFFFF.png",
  imageAlt: "Estudantes de Engenharia Ferroviária da UFSC Joinville",
  blurDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
};

export function AboutSection() {
  return (
    <section id="curso" className="bg-[#242424] py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-8 lg:px-0">
        <AnimatedSection className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-[#2E2E2E]">
            <Image
              src={ABOUT_CONTENT.imageSrc}
              alt={ABOUT_CONTENT.imageAlt}
              fill
              unoptimized
              className="object-cover"
              placeholder="blur"
              blurDataURL={ABOUT_CONTENT.blurDataUrl}
            />
          </div>
          <div className="flex flex-col items-start">
            <h2 className="mb-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {ABOUT_CONTENT.title}
            </h2>
            <p className="mb-8 text-lg leading-8 text-[#A0A0A0]">
              {ABOUT_CONTENT.description}
            </p>
            <Link
              href={ABOUT_CONTENT.buttonHref}
              className="flex min-h-[44px] items-center justify-center rounded-md bg-[#E84E1B] px-6 py-3 text-base font-semibold text-white transition-all hover:-translate-y-[1px] hover:brightness-110 active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E84E1B]"
            >
              {ABOUT_CONTENT.buttonLabel}
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
