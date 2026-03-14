'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
  const { language, toggleLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = () => setIsMenuOpen(false);

  return (
    <nav className="fixed w-full z-50 bg-main/85 backdrop-blur-md border-b border-khaki-500/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
        <a href="#" className="text-xl font-display font-bold tracking-tighter text-stone-100 group">
          MORI<span className="text-khaki-500 group-hover:text-khaki-400 transition-colors">.</span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-stone-400">
          <a href="#about" className="hover:text-khaki-400 transition-colors">{t('nav.about')}</a>
          <a href="#skills" className="hover:text-khaki-400 transition-colors">{t('nav.skills')}</a>
          <a href="#projects" className="hover:text-khaki-400 transition-colors">{t('nav.projects')}</a>
          <a href="#contact" className="px-6 py-2 bg-khaki-500 text-black font-bold text-xs uppercase tracking-wider rounded-full hover:bg-khaki-400 transition-colors shadow-lg shadow-khaki-900/50">{t('nav.contact')}</a>
          <button
            onClick={toggleLanguage}
            className="ml-4 px-3 py-1 rounded border border-stone-700 hover:border-khaki-500 text-xs font-bold uppercase transition-colors"
          >
            {language === 'en' ? 'KO' : 'EN'}
          </button>
        </div>

        {/* Mobile: language toggle + hamburger */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={toggleLanguage}
            className="px-3 py-1 rounded border border-stone-700 hover:border-khaki-500 text-xs font-bold uppercase transition-colors text-stone-400"
          >
            {language === 'en' ? 'KO' : 'EN'}
          </button>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded text-stone-400 hover:text-khaki-400 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-main/95 backdrop-blur-md border-t border-stone-800 px-6 py-4 flex flex-col gap-4 text-sm font-medium text-stone-400">
          <a href="#about" onClick={handleNavClick} className="hover:text-khaki-400 transition-colors py-2">{t('nav.about')}</a>
          <a href="#skills" onClick={handleNavClick} className="hover:text-khaki-400 transition-colors py-2">{t('nav.skills')}</a>
          <a href="#projects" onClick={handleNavClick} className="hover:text-khaki-400 transition-colors py-2">{t('nav.projects')}</a>
          <a href="#contact" onClick={handleNavClick} className="w-full text-center px-6 py-3 bg-khaki-500 text-black font-bold text-xs uppercase tracking-wider rounded-full hover:bg-khaki-400 transition-colors">{t('nav.contact')}</a>
        </div>
      )}
    </nav>
  );
}
