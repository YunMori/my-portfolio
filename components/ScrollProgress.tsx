'use client';

import { useEffect, useRef } from 'react';

export default function ScrollProgress() {
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fallback for browsers without scroll-timeline support
        if (CSS.supports('animation-timeline', 'scroll()')) return;

        const bar = barRef.current;
        if (!bar) return;

        const onScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? scrollTop / docHeight : 0;
            bar.style.setProperty('--scroll-progress', String(progress));
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return <div ref={barRef} className="scroll-progress" />;
}
