'use client';

import { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import TechStack from '@/components/TechStack';
import Projects from '@/components/Projects';
import ProjectSimulator from '@/components/ProjectSimulator';
import Footer from '@/components/Footer';

// --- 초기 프로젝트 데이터 ---
const initialProjects = [
  {
    title: "Dark Mode Tech Blog",
    desc: "MDX 기반의 정적 블로그. 가독성을 위한 타이포그래피 설계.",
    date: "2024.12",
    stack: ["Next.js", "Tailwind", "Git"]
  },
  {
    title: "Sales Admin Dashboard",
    desc: "매출 데이터 시각화 및 관리자 기능 구현.",
    date: "2024.10",
    stack: ["React", "Tailwind", "Node.js"]
  },
  {
    title: "Anonymous Chat Service",
    desc: "Socket.io를 활용한 실시간 채팅 및 트래픽 처리.",
    date: "2024.08",
    stack: ["Node.js", "Socket.io", "Vue"]
  }
];

export default function Home() {
  const [projects, setProjects] = useState(initialProjects);

  // --- 기술 스택 통계 계산 (useMemo로 최적화) ---
  const techStats = useMemo(() => {
    const stats: { [key: string]: number } = {};
    projects.forEach(p => {
      p.stack.forEach(tech => {
        stats[tech] = (stats[tech] || 0) + 1;
      });
    });
    return Object.entries(stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [projects]);

  // --- 시뮬레이션: 프로젝트 추가 ---
  const addRandomProject = () => {
    const demoTitles = ["AI Image Analyzer", "Healthcare App", "Travel Planner", "Portfolio V2"];
    const demoStacks = [
      ["Next.js", "TypeScript", "Supabase"],
      ["Python", "React", "Firebase"],
      ["Vue", "Tailwind", "Node.js"],
      ["Next.js", "Tailwind", "Figma"]
    ];
    const randomIdx = Math.floor(Math.random() * demoTitles.length);
    const randomStack = demoStacks[randomIdx];

    const newProject = {
      title: `${demoTitles[randomIdx]} #${projects.length + 1}`,
      desc: "시뮬레이션으로 추가된 프로젝트입니다. 데이터 변경을 확인하세요.",
      date: "2025.01",
      stack: randomStack
    };

    setProjects([newProject, ...projects]);
  };

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

    // 컴포넌트 마운트 후 DOM 요소 선택
    // 약간의 지연을 주어 자식 컴포넌트 렌더링 확보 (필요 시)
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
      <Hero />
      <TechStack techStats={techStats} totalProjects={projects.length} />
      <Projects projects={projects} />
      <Footer />
      <ProjectSimulator onAddProject={addRandomProject} />
    </main>
  );
}