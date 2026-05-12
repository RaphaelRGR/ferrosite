"use client";

const logos = [
  { src: '/empresas/rumo.png',       alt: 'Rumo Logística' },
  { src: '/empresas/mrs.png',        alt: 'MRS Logística' },
  { src: '/empresas/vli.png',        alt: 'VLI' },
  { src: '/empresas/vale.png',       alt: 'Vale' },
  { src: '/empresas/anptrilhos.png', alt: 'ANPTrilhos' },
  { src: '/empresas/ftc.png',        alt: 'FTC' },
  { src: '/empresas/lanfranco.png',  alt: 'Lanfranco' },
];

const LOGOS_LOOP = [...logos, ...logos];

export function CompaniesSection() {
  return (
    <section className="bg-[#1A1A1A] py-16 overflow-hidden">
      <style jsx>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          gap: 24px;
          width: max-content;
          animation: marquee 30s linear infinite;
        }
      `}</style>

      <div className="mx-auto max-w-6xl px-6 flex flex-col items-center">
        <p className="text-center text-xs uppercase tracking-widest text-[#A0A0A0] mb-8">
          Empresas parceiras e destinos de egressos
        </p>

        <div className="overflow-hidden w-full relative py-4">
          {/* Máscara de gradiente para suavizar as bordas do carrossel */}
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#1A1A1A] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#1A1A1A] to-transparent z-10 pointer-events-none" />

          <div
            className="marquee-track"
            onMouseEnter={e => (e.currentTarget.style.animationPlayState = 'paused')}
            onMouseLeave={e => (e.currentTarget.style.animationPlayState = 'running')}
          >
            {LOGOS_LOOP.map((logo, i) => (
              <div 
                key={i} 
                className="flex items-center justify-center bg-[#FFFFFF] rounded-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-all duration-200 ease-out hover:shadow-[0_4px_20px_rgba(232,78,27,0.15)] hover:-translate-y-1 cursor-default w-[180px] h-[120px] p-4 flex-shrink-0"
              >
                <img 
                  src={logo.src} 
                  alt={logo.alt} 
                  style={{ width: '140px', height: '80px', objectFit: 'contain' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
