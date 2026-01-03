'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <nav className="fixed w-full z-50 bg-main/85 backdrop-blur-md border-b border-khaki-500/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
        <a href="#" className="text-xl font-display font-bold tracking-tighter text-stone-100 group">
          MORI<span className="text-khaki-500 group-hover:text-khaki-400 transition-colors">.</span>
        </a>
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
      </div>
    </nav>
  );
}
