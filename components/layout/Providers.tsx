'use client';

import { ContentLanguageProvider } from '@/i18n/ContentLanguage';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ContentLanguageProvider>
            {children}
        </ContentLanguageProvider>
    );
}
