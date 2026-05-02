'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

/**
 * LOGO: copiar o arquivo LOGOS_DE_FERRO__2_.png para /public/logo-icon.png
 * Refatoração completa da Navbar seguindo os requisitos de design e funcionalidade.
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Controle de scroll para mudar o fundo da navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fecha o dropdown ao clicar fora no desktop
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProjectsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fecha menus ao mudar de rota
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProjectsOpen(false);
  }, [pathname]);

  const navItemStyles = "text-white hover:text-[#E84E1B] transition-colors duration-150 font-medium text-sm uppercase tracking-wide";

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ease-in-out px-6 py-4 ${
        isScrolled 
          ? 'bg-[#1A1A1A] backdrop-blur-sm border-b border-[#2E2E2E]' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* 1. LOGO + BRANDING */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 overflow-hidden rounded-lg">
            <Image 
              src="/logo-icon.png"
              width={40}
              height={40}
              alt="Engenharia Ferroviária e Metroviária UFSC"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-semibold text-sm leading-tight">
              Engenharia Ferroviária
            </span>
            <span className="text-[#A0A0A0] text-xs">
              UFSC Joinville
            </span>
          </div>
        </Link>

        {/* 2. NAVIGATION LINKS (DESKTOP) */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={navItemStyles}>
              {link.name}
            </Link>
          ))}

          {/* 3. DROPDOWN DE PROJETOS */}
          <div 
            className="relative"
            onMouseEnter={() => setIsProjectsOpen(true)}
            onMouseLeave={() => setIsProjectsOpen(false)}
            ref={dropdownRef}
          >
            <button 
              className={`flex items-center gap-1 ${navItemStyles} outline-none`}
              aria-expanded={isProjectsOpen}
            >
              Projetos
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className={`transition-transform duration-200 ${isProjectsOpen ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>

            {/* Dropdown Desktop */}
            {isProjectsOpen && (
              <div className="absolute top-full left-0 mt-2 w-[220px] bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.4)] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {PROJECT_LINKS.map((link) => (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className="block px-4 py-2 text-sm text-white hover:bg-[#2E2E2E] hover:text-[#E84E1B] transition-all duration-150"
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="h-[1px] bg-[#3A3A3A] my-2 mx-2" />
                <Link 
                  href="/projetos"
                  className="block px-4 py-2 text-sm text-white font-semibold hover:bg-[#2E2E2E] hover:text-[#E84E1B] transition-all duration-150"
                >
                  Ver todos →
                </Link>
              </div>
            )}
          </div>

          {/* 4. LOJA */}
          <Link href="/loja" className={navItemStyles}>
            Loja
            {/* TODO: redirecionar para loja externa quando definido */}
          </Link>

          {/* PORTAL BUTTON */}
          <Link 
            href="/portal" 
            className="bg-[#E84E1B] text-white px-4 py-2 rounded-md hover:brightness-110 font-semibold text-sm transition-all flex items-center gap-2"
          >
            Portal →
          </Link>
        </div>

        {/* 5. MOBILE HAMBURGER MENU */}
        <button 
          className="md:hidden text-white p-2 outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isMobileMenuOpen ? (
              <path d="M18 6 6 18M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* 5. MOBILE MENU CONTENT */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#1A1A1A] border-b border-[#2E2E2E] flex flex-col p-6 gap-6 animate-in slide-in-from-top-5 duration-300">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={navItemStyles}>
              {link.name}
            </Link>
          ))}
          
          {/* Accordion Projetos Mobile */}
          <div className="flex flex-col gap-4">
            <button 
              className={`flex items-center justify-between w-full ${navItemStyles} outline-none`}
              onClick={() => setIsProjectsOpen(!isProjectsOpen)}
            >
              Projetos
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className={`transition-transform duration-200 ${isProjectsOpen ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            {isProjectsOpen && (
              <div className="flex flex-col gap-4 pl-4 border-l border-[#2E2E2E] animate-in fade-in duration-300">
                {PROJECT_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className="text-white/60 hover:text-[#E84E1B] text-sm uppercase font-medium transition-colors">
                    · {link.name}
                  </Link>
                ))}
                <Link href="/projetos" className="text-[#E84E1B] text-sm uppercase font-bold transition-colors">
                  · Ver todos →
                </Link>
              </div>
            )}
          </div>

          <Link href="/loja" className={navItemStyles}>
            Loja
          </Link>

          <Link 
            href="/portal" 
            className="bg-[#E84E1B] text-white px-4 py-3 rounded-md text-center font-semibold text-sm hover:brightness-110 transition-all"
          >
            Portal →
          </Link>
        </div>
      )}
    </nav>
  );
}
