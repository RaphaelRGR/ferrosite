import Link from "next/link";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

export function CtaSection() {
  return (
    <section className="bg-[#E84E1B] py-20 md:py-28">
      <AnimatedSection className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="mb-8 text-4xl font-black tracking-tighter text-white sm:text-6xl">
          Pronto para mover o futuro?
        </h2>
        <p className="mb-12 text-xl font-medium text-white/80 leading-relaxed">
          Acesse o Portal e tenha acesso ao nosso acervo técnico, 
          banco de questões e projetos exclusivos.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/portal"
            className="flex min-h-[60px] items-center justify-center rounded-full bg-black px-12 text-lg font-bold text-white transition-all hover:bg-white hover:text-black"
          >
            Entrar no Portal
          </Link>
          <Link
            href="/curso"
            className="flex min-h-[60px] items-center justify-center rounded-full border-2 border-white px-12 text-lg font-bold text-white transition-all hover:bg-white hover:text-[#E84E1B]"
          >
            Mais informações
          </Link>
        </div>
      </AnimatedSection>
    </section>
  );
}
