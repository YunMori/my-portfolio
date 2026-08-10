'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useContentLanguage } from '@/i18n/ContentLanguage';

export default function Navbar() {
  // The chrome below is English-only; this toggle switches the language of the
  // *content* (blog posts, project descriptions).
  const { language, toggleLanguage } = useContentLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMenuOpen(false);
    };
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleNavClick = () => setIsMenuOpen(false);

  return (
    <nav className={`fixed w-full z-50 backdrop-blur-md border-b transition-all duration-500 ${scrolled ? 'bg-main/95 border-green-500/10' : 'bg-main/0 border-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
        <Link href="/" className="text-xl font-display font-bold tracking-tighter text-stone-100 group">
          MORI<span className="text-green-500 group-hover:text-green-400 group-hover:scale-150 transition-all inline-block">.</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-stone-400">
          <Link href="/#about" className="hover:text-green-400 transition-colors">About</Link>
          <Link href="/#skills" className="hover:text-green-400 transition-colors">Skills</Link>
          <Link href="/#projects" className="hover:text-green-400 transition-colors">Projects</Link>
          <Link href="/blog" className="hover:text-green-400 transition-colors">Blog</Link>
          <Link href="/#contact" className="btn-shimmer px-6 py-2 bg-green-500 text-black font-bold text-xs uppercase tracking-wider rounded-full hover:bg-green-400 transition-colors shadow-lg shadow-green-900/50">Contact</Link>
          <button
            onClick={toggleLanguage}
            aria-label={language === 'en' ? 'Show content in Korean' : 'Show content in English'}
            className="ml-4 px-3 py-1 rounded border border-stone-700 hover:border-green-500 text-xs font-bold uppercase transition-colors"
          >
            {language === 'en' ? 'KO' : 'EN'}
          </button>
        </div>

        {/* Mobile: language toggle + hamburger */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={toggleLanguage}
            aria-label={language === 'en' ? 'Show content in Korean' : 'Show content in English'}
            className="px-3 py-1 rounded border border-stone-700 hover:border-green-500 text-xs font-bold uppercase transition-colors text-stone-400"
          >
            {language === 'en' ? 'KO' : 'EN'}
          </button>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded text-stone-400 hover:text-green-400 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu with slide animation */}
      <div className={`md:hidden bg-main/95 backdrop-blur-md border-t border-stone-800 px-6 flex flex-col gap-4 text-sm font-medium text-stone-400 overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-64 py-4 opacity-100' : 'max-h-0 py-0 opacity-0'}`}>
        <Link href="/#about" onClick={handleNavClick} className="hover:text-green-400 transition-colors py-2">About</Link>
        <Link href="/#skills" onClick={handleNavClick} className="hover:text-green-400 transition-colors py-2">Skills</Link>
        <Link href="/#projects" onClick={handleNavClick} className="hover:text-green-400 transition-colors py-2">Projects</Link>
        <Link href="/blog" onClick={handleNavClick} className="hover:text-green-400 transition-colors py-2">Blog</Link>
        <Link href="/#contact" onClick={handleNavClick} className="w-full text-center px-6 py-3 bg-green-500 text-black font-bold text-xs uppercase tracking-wider rounded-full hover:bg-green-400 transition-colors">Contact</Link>
      </div>
    </nav>
  );
}
