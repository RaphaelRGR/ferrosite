import Link from "next/link";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

const EVENTS_CONTENT = {
  title: "Agenda AFER",
  buttonLabel: "Ver calendário completo →",
  buttonHref: "/eventos",
};

const EVENTS = [
  {
    id: 1,
    title: "Cavalos de Ferro 2026",
    description: "Competição estudantil de engenharia ferroviária.",
    info1: "Inscrições abertas até 20 de maio de 2026",
    info2: "Evento em 1º de julho de 2026",
    badge: "Inscrições abertas",
    badgeColor: "bg-green-600 text-white",
    icon: (
      <svg className="h-8 w-8 text-[#E84E1B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    id: 2,
    title: "HackFerro 2026",
    description: "Primeiro hackathon de engenharia ferroviária do Brasil, organizado pela AFER.",
    info1: "Segundo semestre de 2026",
    info2: null,
    badge: "Em breve",
    badgeColor: "bg-[#3A3A3A] text-white",
    icon: (
      <svg className="h-8 w-8 text-[#E84E1B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

export function EventsSection() {
  return (
    <section className="bg-[#242424] py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-8 lg:px-0">
        <AnimatedSection>
          <h2 className="mb-12 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {EVENTS_CONTENT.title}
          </h2>

          <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {EVENTS.map((event) => (
              <article 
                key={event.id} 
                className="relative flex flex-col rounded-2xl border border-[#3A3A3A] bg-[#2E2E2E] p-8 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(232,78,27,0.15)]"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="rounded-lg bg-[#1A1A1A] p-3">
                    {event.icon}
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${event.badgeColor}`}>
                    {event.badge}
                  </span>
                </div>
                <h3 className="mb-4 text-2xl font-bold text-white">{event.title}</h3>
                <p className="mb-6 flex-1 text-base leading-7 text-[#A0A0A0]">
                  {event.description}
                </p>
                <ul className="space-y-3 text-sm text-[#A0A0A0]">
                  {event.info1 && (
                    <li className="flex items-center gap-3">
                      <svg className="h-5 w-5 text-[#3A3A3A]" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      {event.info1}
                    </li>
                  )}
                  {event.info2 && (
                    <li className="flex items-center gap-3">
                      <svg className="h-5 w-5 text-[#3A3A3A]" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      {event.info2}
                    </li>
                  )}
                </ul>
              </article>
            ))}
          </div>

          <div className="flex justify-center lg:justify-start">
            <Link
              href={EVENTS_CONTENT.buttonHref}
              className="flex min-h-[44px] items-center text-base font-semibold leading-6 text-[#E84E1B] transition-colors hover:text-[#E84E1B]/80"
            >
              {EVENTS_CONTENT.buttonLabel}
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
