'use client';

import React, { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';
import { translations, Language } from '@/utils/translations';

type LanguageContextType = {
    language: Language;
    toggleLanguage: () => void;
    t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'portfolio-lang';
const DEFAULT_LANGUAGE: Language = 'en';

function isLanguage(value: string | null): value is Language {
    return value === 'en' || value === 'ko';
}

// localStorage is an external store, so React reads it through
// useSyncExternalStore rather than a setState-in-effect. That keeps the server
// snapshot ('en') and the first client render consistent — no hydration
// mismatch — and re-renders only the subscribers when the value actually changes.
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
    listeners.add(onChange);
    // Keep tabs in sync: `storage` fires in *other* tabs when one of them writes.
    window.addEventListener('storage', onChange);
    return () => {
        listeners.delete(onChange);
        window.removeEventListener('storage', onChange);
    };
}

function getSnapshot(): Language {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isLanguage(saved) ? saved : DEFAULT_LANGUAGE;
}

// The server has no localStorage, so it always renders the default.
function getServerSnapshot(): Language {
    return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const language = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    const toggleLanguage = useCallback(() => {
        const next: Language = language === 'en' ? 'ko' : 'en';
        localStorage.setItem(STORAGE_KEY, next);
        // `storage` does not fire in the tab that wrote, so notify this one directly.
        listeners.forEach(listener => listener());
    }, [language]);

    const t = useCallback((key: string): string => {
        // Walk a dotted path like 'hero.greeting' through the translation tree.
        let current: unknown = translations[language];

        for (const segment of key.split('.')) {
            if (typeof current !== 'object' || current === null || !(segment in current)) {
                console.warn(`Missing translation for key: ${key}`);
                return key;
            }
            current = (current as Record<string, unknown>)[segment];
        }

        return typeof current === 'string' ? current : key;
    }, [language]);

    // Memoised: an inline object here would be a new reference on every render,
    // re-rendering every consumer of this context whether or not the language changed.
    const value = useMemo(
        () => ({ language, toggleLanguage, t }),
        [language, toggleLanguage, t]
    );

    return (
        <LanguageContext.Provider value={value}>
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
