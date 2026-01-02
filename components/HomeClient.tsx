'use client';

import { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import TechStack from '@/components/TechStack';
import Projects from '@/components/Projects';
import Footer from '@/components/Footer';
import { Project, Profile } from '@/types/database.types';

// Fallback data if DB is empty
const fallbackProjects = [
    {
        title: "Dark Mode Tech Blog",
        description: "MDX 기반의 정적 블로그. 가독성을 위한 타이포그래피 설계.",
        date: "2024.12",
        stack: ["Next.js", "Tailwind", "Git"]
    },
    {
        title: "Sales Admin Dashboard",
        description: "매출 데이터 시각화 및 관리자 기능 구현.",
        date: "2024.10",
        stack: ["React", "Tailwind", "Node.js"]
    },
    {
        title: "Anonymous Chat Service",
        description: "Socket.io를 활용한 실시간 채팅 및 트래픽 처리.",
        date: "2024.08",
        stack: ["Node.js", "Socket.io", "Vue"]
    }
];

interface HomeClientProps {
    initialProjects: Project[];
    profile: Profile | null;
}

export default function HomeClient({ initialProjects, profile }: HomeClientProps) {
    const startProjects = initialProjects.length > 0 ? initialProjects : (fallbackProjects as any[]);
    const [projects, setProjects] = useState(startProjects);

    // Sync state with server data when it changes
    useEffect(() => {
        if (initialProjects.length > 0) {
            setProjects(initialProjects);
        }
    }, [initialProjects]);

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
            const fadeElems = document.querySelectorAll('.fade-in-section');
            fadeElems.forEach(el => observer.observe(el));
        }, 100);

        return () => {
            observer.disconnect();
            clearTimeout(timeoutId);
        };
    }, [projects]);

    return (
        <main className="min-h-screen selection:bg-khaki-900 selection:text-khaki-400 pb-0">
            <Navbar />
            {/* Pass profile data to Hero */}
            <Hero profile={profile} />
            <TechStack techStats={techStats} totalProjects={projects.length} />
            <Projects projects={projects} />
            <Footer />
        </main>
    );
}
