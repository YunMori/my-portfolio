'use client'

import { Post } from '@/types/database.types';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { readingTime } from '@/utils/post';

interface BlogListProps {
    posts: Post[];
}

export default function BlogList({ posts }: BlogListProps) {
    const { t } = useLanguage();
    const [activeFilter, setActiveFilter] = useState<string>('__all__');
    // 한 번 이상 뷰포트에 진입한 글 ID 기억 → 재등장 시 즉시 표시 (Projects 패턴과 동일)
    const visibleIds = useRef(new Set<string>());
    const [, forceUpdate] = useState(0);

    const ALL_KEY = '__all__';
    const allTags = [ALL_KEY, ...Array.from(new Set(posts.flatMap(p => p.tags ?? []))).sort()];
    const filteredPosts = activeFilter === ALL_KEY
        ? posts
        : posts.filter(p => (p.tags ?? []).includes(activeFilter));

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            let changed = false;
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = (entry.target as HTMLElement).dataset.postId;
                    if (id && !visibleIds.current.has(id)) {
                        visibleIds.current.add(id);
                        changed = true;
                    }
                }
            });
            if (changed) forceUpdate(n => n + 1);
        }, { threshold: 0.1 });

        const timeoutId = setTimeout(() => {
            document.querySelectorAll('#blog-list [data-post-id]')
                .forEach(el => observer.observe(el));
        }, 50);

        return () => {
            observer.disconnect();
            clearTimeout(timeoutId);
        };
    }, [activeFilter]);

    return (
        <section id="blog" className="py-24 bg-main relative min-h-screen">
            <div className="max-w-4xl mx-auto px-6">
                <div className="relative mb-16 space-y-4 pt-16">
                    <span className="text-green-400 font-bold tracking-widest text-xs uppercase">{t('blog.header')}</span>
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-stone-100">
                        {t('blog.title')}
                    </h1>
                </div>

                {/* Tag Filter */}
                {allTags.length > 1 && (
                    <div className="flex flex-wrap gap-2 mb-10">
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setActiveFilter(tag)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${
                                    activeFilter === tag
                                        ? 'bg-green-400 text-black border-green-400'
                                        : 'bg-transparent text-stone-400 border-stone-700 hover:border-green-500 hover:text-green-400'
                                }`}
                            >
                                {tag === ALL_KEY ? t('blog.filterAll') : tag}
                            </button>
                        ))}
                    </div>
                )}

                {filteredPosts.length === 0 ? (
                    <p className="text-stone-500 italic py-20 text-center">{t('blog.empty')}</p>
                ) : (
                    <div id="blog-list" className="flex flex-col">
                        {filteredPosts.map((post, index) => {
                            const isVisible = visibleIds.current.has(post.id);
                            return (
                                <Link
                                    key={post.id}
                                    href={`/blog/${post.slug}`}
                                    data-post-id={post.id}
                                    className={`group flex items-start justify-between gap-6 py-8 border-t border-highlight last:border-b transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                                    style={{ transitionDelay: isVisible ? '0ms' : `${index * 80}ms` }}
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-3 mb-3 text-[11px] font-mono text-stone-500 uppercase tracking-wider">
                                            <span>{post.date}</span>
                                            <span className="text-stone-700">·</span>
                                            <span>{readingTime(post.content)} {t('blog.min')}</span>
                                        </div>
                                        <h2 className="text-xl md:text-2xl font-display font-bold text-stone-200 group-hover:text-green-400 transition-colors leading-snug mb-2">
                                            {post.title}
                                        </h2>
                                        <p className="text-stone-400 text-sm leading-relaxed line-clamp-2 mb-3">
                                            {post.description}
                                        </p>
                                        {(post.tags ?? []).length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {post.tags.map(tag => (
                                                    <span key={tag} className="text-[10px] font-mono text-green-400 bg-green-900/40 border border-green-600/60 rounded px-2 py-0.5">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <i className="fa-solid fa-arrow-right text-green-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all mt-2 shrink-0"></i>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
