'use client'

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useContentLanguage } from '@/i18n/ContentLanguage';
import { pick, pickLang } from '@/i18n/localize';
import type { ProjectCard } from '@/app/actions/projects';

interface ProjectsProps {
    projects: ProjectCard[];
}

/*
 * 카드 그리드. 상세는 /projects/[slug]가 맡는다.
 *
 * 예전에는 카드를 누르면 모달이 열리고 그 안에서 stored content를 보여주거나, 없으면
 * 브라우저가 직접 GitHub API를 호출해 README를 받아왔다. 상세가 실제 페이지가 되면서
 * 모달·README fetch·마크다운 파서가 전부 여기서 빠졌고, 덕분에 프로젝트 본문이 홈
 * payload에 실려 나가지 않는다 (app/actions/projects.ts의 PROJECT_CARD_SELECT 참고).
 */
export default function Projects({ projects }: ProjectsProps) {
    const { language } = useContentLanguage();
    const [activeFilter, setActiveFilter] = useState<string>('__all__');
    // 한 번 이상 뷰포트에 진입한 프로젝트 ID 기억 → 재등장 시 즉시 표시.
    // ref가 아니라 state인 이유: 아래 목록이 렌더 중에 이 값을 읽는다 (BlogList와 동일).
    const [visibleIds, setVisibleIds] = useState<ReadonlySet<string>>(() => new Set());

    const ALL_KEY = '__all__';
    const allTechs = [ALL_KEY, ...Array.from(new Set(projects.flatMap(p => p.stack))).sort()];
    const filteredProjects = activeFilter === ALL_KEY
        ? projects
        : projects.filter(p => p.stack.includes(activeFilter));

    // 필터 변경 시 새 카드에 Observer 등록.
    // JS classList 조작 대신 visibleIds Set으로 React가 직접 opacity를 제어한다
    // → 필터 전환 후 재등장하는 카드도 transitionDelay 없이 즉시 표시됨
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const seen = entries
                .filter(entry => entry.isIntersecting)
                .map(entry => (entry.target as HTMLElement).dataset.projectId)
                .filter((id): id is string => !!id);

            if (seen.length === 0) return;

            setVisibleIds(prev => {
                const next = new Set(prev);
                seen.forEach(id => next.add(id));
                // 이미 전부 표시된 상태면 같은 참조를 돌려줘 불필요한 리렌더를 막는다.
                return next.size === prev.size ? prev : next;
            });
        }, { threshold: 0.1 });

        const timeoutId = setTimeout(() => {
            document.querySelectorAll('#projects [data-project-id]')
                .forEach(el => observer.observe(el));
        }, 50);

        return () => {
            observer.disconnect();
            clearTimeout(timeoutId);
        };
    }, [activeFilter]);

    return (
        <section id="projects" className="py-24 bg-main relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="relative mb-20 space-y-4 text-center md:text-left">
                    <span className="text-green-400 font-bold tracking-widest text-xs uppercase">Selected Works</span>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-stone-100">
                        Recent Projects
                    </h2>
                </div>

                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-2 mb-12">
                    {allTechs.map(tech => (
                        <button
                            key={tech}
                            onClick={() => setActiveFilter(tech)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${
                                activeFilter === tech
                                    ? 'bg-green-400 text-black border-green-400'
                                    : 'bg-transparent text-stone-400 border-stone-700 hover:border-green-500 hover:text-green-400'
                            }`}
                        >
                            {tech === ALL_KEY ? 'All' : tech}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredProjects.map((p, index) => {
                        const isVisible = visibleIds.has(p.id);
                        return (
                        <Link
                            key={p.id}
                            href={`/projects/${encodeURIComponent(p.slug)}`}
                            data-project-id={p.id}
                            className={`card-glow group rounded-2xl overflow-visible bg-surface border border-highlight hover:border-green-500 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(74,124,89,0.15)] flex flex-col h-full ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-[0.95]'}`}
                            style={{ transitionDelay: isVisible ? '0ms' : `${index * 150}ms` }}
                        >
                            <div className="h-52 bg-[#151412] relative flex items-center justify-center border-b border-stone-800 shrink-0">
                                {/* Image Placeholder or Actual Image */}
                                <div className="w-20 h-20 rounded-full bg-stone-800 flex items-center justify-center text-stone-600 group-hover:text-green-500 group-hover:scale-[1.3] group-hover:rotate-12 transition-all duration-500">
                                    <i className="fa-solid fa-code text-3xl"></i>
                                </div>
                                <div className="absolute top-4 right-4 flex gap-2">
                                    {p.stack.slice(0, 2).map(tech => (
                                        <span key={tech} className="bg-black/50 backdrop-blur-md border border-stone-800 text-[10px] px-2 py-1 rounded-full text-stone-400">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="p-8 flex flex-col flex-grow">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 lang={pickLang(p, 'title', language)} className="text-xl font-bold text-stone-200 group-hover:text-green-500 transition-colors flex-1 min-w-0 line-clamp-2">
                                        {pick(p, 'title', language)}
                                    </h3>
                                    <span className="text-xs font-mono text-stone-400 shrink-0 ml-4">{p.date}</span>
                                </div>
                                <p lang={pickLang(p, 'description', language)} className="text-stone-400 text-sm leading-relaxed mb-6 flex-grow">
                                    {pick(p, 'description', language)}
                                </p>
                                <div className="flex items-center gap-2 mt-auto">
                                    {/* 카드 전체가 <Link>라 여기는 표시용 span이다 (링크 안에 링크를 넣지 않는다) */}
                                    <span className="text-xs font-bold text-stone-300 group-hover:text-white flex items-center gap-2 transition-all">
                                        View Case Study <i className="fa-solid fa-arrow-right text-green-500 group-hover:translate-x-1 transition-transform"></i>
                                    </span>
                                </div>
                            </div>
                        </Link>
                        );
                    })}
                </div>
            </div>

        </section>
    );
}
