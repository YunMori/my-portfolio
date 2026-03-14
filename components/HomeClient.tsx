'use client';

import { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import TechStack from '@/components/TechStack';
import Projects from '@/components/Projects';
import Blog from '@/components/Blog';
import Footer from '@/components/Footer';
import { Project, BlogPost } from '@/types/database.types';

interface HomeClientProps {
    initialProjects: Project[];
    initialBlogPosts: BlogPost[];
}

export default function HomeClient({ initialProjects, initialBlogPosts }: HomeClientProps) {
    const [projects, setProjects] = useState(initialProjects);

    // Sync state with server data when it changes
    useEffect(() => {
        if (initialProjects.length > 0) {
            setProjects(initialProjects);
        }
    }, [initialProjects]);

    // Track Page View
    useEffect(() => {
        // Simple distinct check could be added here (sessionStorage),
        // but for now we just count every load as a view.
        import('@/app/actions').then(actions => {
            actions.incrementView();
        });
    }, []);

    // --- 기술 스택 통계 계산 (useMemo로 최적화) ---
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

    // --- 스크롤 애니메이션 (Intersection Observer) ---
    // Projects 섹션 외 다른 fade-in-section 요소들 (Hero, TechStack 등) 처리
    // Projects 카드의 필터 연동 Observer는 Projects.tsx 내부에서 별도 관리
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
            // #projects 외부의 fade-in-section 요소만 여기서 처리
            document.querySelectorAll('.fade-in-section:not(#projects .fade-in-section)')
                .forEach(el => observer.observe(el));
        }, 100);

        return () => {
            observer.disconnect();
            clearTimeout(timeoutId);
        };
    }, [projects]);

    return (
        <main className="min-h-screen selection:bg-khaki-900 selection:text-khaki-400 pb-0">
            <Navbar />
            {/* Hero Section (Hardcoded) */}
            <Hero />
            <TechStack techStats={techStats} totalProjects={projects.length} />
            <Projects projects={projects} />
            <Blog posts={initialBlogPosts} />
            <Footer />
        </main>
    );
}
