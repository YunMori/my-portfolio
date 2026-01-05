'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function CatAnimation() {
    return (
        <div className="absolute bottom-0 w-full h-12 overflow-hidden pointer-events-none z-20">
            <div className="absolute bottom-0 animate-walk">
                <div className="animate-hop text-stone-600">
                    <i className="fa-solid fa-cat text-3xl opacity-50"></i>
                </div>
            </div>
        </div>
    );
}
