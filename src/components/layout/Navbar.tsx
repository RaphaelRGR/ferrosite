'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';

/**
 * Navbar refatorada:
 * - Formato arredondado (pill)
 * - Esconde ao rolar para baixo, aparece ao rolar para cima
 * - Animações fluidas (GSAP)
 */

const NAV_LINKS = [
  { name: 'Sobre', href: '/sobre' },
  { name: 'Curso', href: '/curso' },
  { name: 'Visitas', href: '/visitas' },
  { name: 'Eventos', href: '/eventos' },
  { name: 'Notícias', href: '/noticias' },
];

const PROJECT_LINKS = [
  { name: 'Comunica Ferro', href: '/projetos/comunica-ferro' },
  { name: 'Cavalos de Ferro', href: '/projetos/cavalos-de-ferro' },
  { name: 'Ferro Lab', href: '/projetos/ferro-lab' },
  { name: 'Projetos de Extensão', href: '/projetos/extensao' },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  const navRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const pathname = usePathname();

  // Controle de scroll para visibilidade e background
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Background translúcido após scroll inicial
      setIsScrolled(currentScrollY > 50);

      // Lógica de esconder/mostrar baseado na direção
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animação GSAP para entrada/saída "fluida"
  useEffect(() => {
    if (!navRef.current) return;

    if (isVisible) {
      gsap.to(navRef.current, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: "power4.out", // Suave e rápido no final
        display: "block"
      });
    } else {
      gsap.to(navRef.current, {
        y: -100,
        opacity: 0,
        scale: 0.95,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          if (!isVisible && navRef.current) {
             // Mantém display block se mobile menu estiver aberto ou algo assim, mas aqui simplificamos
          }
        }
      });
    }
  }, [isVisible]);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsProjectsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsProjectsOpen(false);
    }, 300);
  };

  // Fecha menus ao mudar de rota
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProjectsOpen(false);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pathname]);

  const navItemStyles = "text-white/80 hover:text-[#E84E1B] transition-all duration-300 font-medium text-[13px] uppercase tracking-wider";

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
      <nav 
        ref={navRef}
        className={`pointer-events-auto max-w-5xl w-full transition-all duration-500 ease-in-out px-8 py-3 rounded-full border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-md ${
          isScrolled ? 'bg-black/60' : 'bg-black/20'
        }`}
      >
        <div className="flex items-center justify-between">
          
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative w-8 h-8 overflow-hidden rounded-full border border-white/20 transition-transform group-hover:scale-110">
              <Image 
                src="/logo-icon.png"
                width={32}
                height={32}
                alt="Logo"
                className="object-cover"
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-white font-bold text-xs leading-tight tracking-tight">
                ENGENHARIA FERROVIÁRIA
              </span>
            </div>
          </Link>

          {/* NAV LINKS (DESKTOP) */}
          <div className="hidden lg:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={navItemStyles}>
                {link.name}
              </Link>
            ))}

            {/* DROPDOWN PROJETOS */}
            <div 
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button className={`flex items-center gap-1.5 ${navItemStyles} outline-none`}>
                Projetos
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform duration-300 ${isProjectsOpen ? 'rotate-180' : ''}`}>
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>

              {isProjectsOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[220px] bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  <div className="py-2">
                    {PROJECT_LINKS.map((link) => (
                      <Link 
                        key={link.href} 
                        href={link.href}
                        className="block px-5 py-2.5 text-xs text-white/70 hover:bg-[#E84E1B] hover:text-white transition-all"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link href="/portal" className="bg-[#E84E1B] text-white px-5 py-2 rounded-full hover:scale-105 hover:shadow-[0_0_20px_rgba(232,78,27,0.4)] transition-all font-bold text-xs uppercase tracking-widest">
              Portal
            </Link>
          </div>

          {/* MOBILE TOGGLE */}
          <button 
            className="lg:hidden text-white p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isMobileMenuOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* MOBILE MENU */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 flex flex-col gap-4 border-t border-white/10 pt-4 animate-in slide-in-from-top-2">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-white text-sm font-medium uppercase tracking-wide">
                {link.name}
              </Link>
            ))}
            <Link href="/portal" className="text-[#E84E1B] font-bold text-sm uppercase">Portal →</Link>
          </div>
        )}
      </nav>
    </div>
  );
}
