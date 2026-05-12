import Link from "next/link";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

/**
 * CtaSection — seção de call-to-action final.
 * Botões em coluna no mobile, linha no desktop.
 */
export function CtaSection() {
  return (
    <section className="bg-[#E84E1B] py-16 sm:py-20 md:py-28">
      <AnimatedSection className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <h2 className="mb-6 sm:mb-8 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white leading-tight">
          Pronto para mover o futuro?
        </h2>
        <p className="mb-10 sm:mb-12 text-base sm:text-xl font-medium text-white/80 leading-relaxed max-w-2xl mx-auto">
          Acesse o Portal e tenha acesso ao nosso acervo técnico,
          banco de questões e projetos exclusivos.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/portal"
            className="flex min-h-[52px] sm:min-h-[60px] items-center justify-center rounded-full bg-black px-8 sm:px-12 text-sm sm:text-lg font-bold text-white transition-all hover:bg-white hover:text-black active:scale-95"
          >
            Entrar no Portal
          </Link>
          <Link
            href="/curso"
            className="flex min-h-[52px] sm:min-h-[60px] items-center justify-center rounded-full border-2 border-white px-8 sm:px-12 text-sm sm:text-lg font-bold text-white transition-all hover:bg-white hover:text-[#E84E1B] active:scale-95"
          >
            Mais informações
          </Link>
        </div>
      </AnimatedSection>
    </section>
  );
}
