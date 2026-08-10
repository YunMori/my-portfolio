'use client';

import React, { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';

export type Language = 'en' | 'ko';

type ContentLanguageContextType = {
    language: Language;
    toggleLanguage: () => void;
};

const ContentLanguageContext = createContext<ContentLanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'portfolio-lang';
const DEFAULT_LANGUAGE: Language = 'en';

function isLanguage(value: string | null): value is Language {
    return value === 'en' || value === 'ko';
}

// The UI chrome is English-only. This store decides which language the *content*
// (blog posts, project descriptions) renders in — see i18n/localize.ts.
//
// localStorage is an external store, so React reads it through
// useSyncExternalStore rather than a setState-in-effect. That keeps the server
// snapshot ('en') and the first client render consistent — no hydration
// mismatch — and re-renders only the subscribers when the value actually changes.
const listeners = new Set<() => void>();

// Only consulted when localStorage is unavailable. Without it, a blocked-storage
// browser would write nothing, read nothing, and the toggle would appear dead.
let fallbackLanguage: Language | null = null;

function subscribe(onChange: () => void) {
    listeners.add(onChange);
    // Keep tabs in sync: `storage` fires in *other* tabs when one of them writes.
    window.addEventListener('storage', onChange);
    return () => {
        listeners.delete(onChange);
        window.removeEventListener('storage', onChange);
    };
}

/**
 * No stored choice yet: follow the browser so a Korean visitor gets Korean posts
 * without having to find the toggle. `navigator.language` is stable, so this stays
 * safe to call from getSnapshot, which must return the same value every time.
 */
function detectFromBrowser(): Language {
    return (navigator.language || '').toLowerCase().startsWith('ko') ? 'ko' : DEFAULT_LANGUAGE;
}

function getSnapshot(): Language {
    // Reading localStorage throws outright when storage is blocked (Safari private
    // mode, third-party iframe, cookies disabled). This runs during render, so an
    // unguarded read would take the whole app down rather than just losing the
    // preference.
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return isLanguage(saved) ? saved : detectFromBrowser();
    } catch {
        return fallbackLanguage ?? detectFromBrowser();
    }
}

// The server has no localStorage, so it always renders the default.
function getServerSnapshot(): Language {
    return DEFAULT_LANGUAGE;
}

export function ContentLanguageProvider({ children }: { children: React.ReactNode }) {
    const language = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    const toggleLanguage = useCallback(() => {
        const next: Language = language === 'en' ? 'ko' : 'en';
        fallbackLanguage = next;
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // Storage blocked — `fallbackLanguage` keeps the toggle working for this
            // page view, it just will not survive a reload.
        }
        // `storage` does not fire in the tab that wrote, so notify this one directly.
        listeners.forEach(listener => listener());
    }, [language]);

    // Memoised: an inline object here would be a new reference on every render,
    // re-rendering every consumer of this context whether or not the language changed.
    const value = useMemo(
        () => ({ language, toggleLanguage }),
        [language, toggleLanguage]
    );

    return (
        <ContentLanguageContext.Provider value={value}>
            {children}
        </ContentLanguageContext.Provider>
    );
}

export function useContentLanguage() {
    const context = useContext(ContentLanguageContext);
    if (context === undefined) {
        throw new Error('useContentLanguage must be used within a ContentLanguageProvider');
    }
    return context;
}
