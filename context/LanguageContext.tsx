'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '@/utils/translations';

type LanguageContextType = {
    language: Language;
    toggleLanguage: () => void;
    t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');

    // Load saved language on mount
    useEffect(() => {
        const saved = localStorage.getItem('portfolio-lang') as Language;
        if (saved && (saved === 'en' || saved === 'ko')) {
            setLanguage(saved);
        }
    }, []);

    const toggleLanguage = () => {
        const newLang = language === 'en' ? 'ko' : 'en';
        setLanguage(newLang);
        localStorage.setItem('portfolio-lang', newLang);
    };

    // Helper to access nested keys string 'hero.greeting'
    const t = (key: string): string => {
        const keys = key.split('.');
        let current: any = translations[language];

        for (const k of keys) {
            if (current[k] === undefined) {
                console.warn(`Missing translation for key: ${key}`);
                return key;
            }
            current = current[k];
        }
        return current;
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
