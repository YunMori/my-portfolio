'use client';

import { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import TechStack from '@/components/TechStack';
import Projects from '@/components/Projects';
import Footer from '@/components/Footer';
import ScrollProgress from '@/components/ScrollProgress';
import SocialProof from '@/components/SocialProof';
import { Project } from '@/types/database.types';

interface HomeClientProps {
    initialProjects: Project[];
}

export default function HomeClient({ initialProjects }: HomeClientProps) {
    const [projects, setProjects] = useState(initialProjects);

    useEffect(() => {
        if (initialProjects.length > 0) {
            setProjects(initialProjects);
        }
    }, [initialProjects]);

    // Track Page View
    useEffect(() => {
        import('@/app/actions').then(actions => {
            actions.incrementView();
        });
    }, []);

    const techStats = useMemo(() => {
        const stats: { [key: string]: number } = {};
        projects.forEach((p: any) => {
            p.stack.forEach((tech: string) => {
                stats[tech] = (stats[tech] || 0) + 1;
            });
        });
        return Object.entries(stats)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [projects]);

    // Scroll animation (IntersectionObserver) for non-Projects sections
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('opacity-100', 'translate-y-0');
                    entry.target.classList.remove('opacity-0', 'translate-y-5');
                }
            });
        }, { threshold: 0.1 });

        const timeoutId = setTimeout(() => {
            document.querySelectorAll('.fade-in-section:not(#projects .fade-in-section)')
                .forEach(el => observer.observe(el));
        }, 100);

        return () => {
            observer.disconnect();
            clearTimeout(timeoutId);
        };
    }, [projects]);

    return (
        <main className="min-h-screen selection:bg-green-900 selection:text-green-400 pb-0">
            <ScrollProgress />
            <Navbar />
            <Hero />
            <div className="section-divider" />
            <TechStack techStats={techStats} totalProjects={projects.length} />
            <div className="section-divider" />
            <Projects projects={projects} />
            <div className="section-divider" />
            <SocialProof totalProjects={projects.length} totalTech={techStats.length} />
            <Footer />
        </main>
    );
}
