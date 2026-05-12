"use client";

// Lista de logos de empresas parceiras
const logos = [
  { src: "/empresas/rumo.png",       alt: "Rumo Logística" },
  { src: "/empresas/mrs.png",        alt: "MRS Logística"  },
  { src: "/empresas/vli.png",        alt: "VLI"            },
  { src: "/empresas/vale.png",       alt: "Vale"           },
  { src: "/empresas/anptrilhos.png", alt: "ANPTrilhos"     },
  { src: "/empresas/ftc.png",        alt: "FTC"            },
  { src: "/empresas/lanfranco.png",  alt: "Lanfranco"      },
];

// Duplica para efeito de loop contínuo
const LOGOS_LOOP = [...logos, ...logos];

/**
 * CompaniesSection — carrossel infinito sem gsap e sem style jsx.
 * A animação é definida via globals.css (keyframe marquee).
 */
export function CompaniesSection() {
  return (
    <section className="bg-[#1A1A1A] py-12 sm:py-16 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col items-center">
        <p className="text-center text-[10px] sm:text-xs uppercase tracking-widest text-[#A0A0A0] mb-6 sm:mb-8">
          Empresas parceiras e destinos de egressos
        </p>

        <div className="overflow-hidden w-full relative py-3 sm:py-4">
          {/* Máscaras laterais para suavizar as bordas */}
          <div className="absolute inset-y-0 left-0 w-12 sm:w-20 bg-gradient-to-r from-[#1A1A1A] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-12 sm:w-20 bg-gradient-to-l from-[#1A1A1A] to-transparent z-10 pointer-events-none" />

          {/* Track animado via classe CSS definida em globals.css */}
          <div
            className="marquee-track"
            onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = "paused")}
            onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = "running")}
          >
            {LOGOS_LOOP.map((logo, i) => (
              <div
                key={i}
                className="flex items-center justify-center bg-white rounded-xl shadow-sm transition-all duration-200 ease-out hover:shadow-[0_4px_20px_rgba(232,78,27,0.15)] hover:-translate-y-1 cursor-default flex-shrink-0"
                style={{ width: 140, height: 90 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo.src}
                  alt={logo.alt}
                  style={{ width: 110, height: 65, objectFit: "contain" }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
