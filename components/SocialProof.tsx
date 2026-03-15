'use client';

import { useLanguage } from '@/context/LanguageContext';

interface SocialProofProps {
    totalProjects: number;
    totalTech: number;
}

export default function SocialProof({ totalProjects, totalTech }: SocialProofProps) {
    const { t } = useLanguage();

    const stats = [
        { value: `${totalProjects}+`, label: 'Projects' },
        { value: `${totalTech}`, label: 'Technologies' },
        { value: '\u2714', label: 'Open to Work' },
    ];

    return (
        <section className="py-20 bg-[#0d0b09] relative overflow-hidden">
            <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse at 50% 50%, rgba(74,124,89,0.04) 0%, transparent 70%)'
            }}></div>
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 text-center">
                    {stats.map((stat, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <span className="text-5xl md:text-6xl font-display font-bold text-green-500">
                                {stat.value}
                            </span>
                            <span className="text-sm font-bold uppercase tracking-widest text-brown-400">
                                {stat.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
