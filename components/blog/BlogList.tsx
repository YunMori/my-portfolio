'use client'

import { PostListItem, Category } from '@/types/database.types';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useContentLanguage, Language } from '@/i18n/ContentLanguage';
import { pick, pickLang } from '@/i18n/localize';
import { formatPostDate } from '@/utils/post';

/**
 * The estimate for the body actually on screen, so the list agrees with the number
 * the post page derives from the same text. Falls back to the original's estimate
 * when there is no translation — that is what `pick` will render too.
 */
function readingMinutes(post: PostListItem, language: Language): number {
    return language === 'en' && post.readingMinutesEn !== null
        ? post.readingMinutesEn
        : post.readingMinutes;
}

interface BlogListProps {
    posts: PostListItem[];
    categories: Category[];
    /** Active category slug from ?category=, or null for "all". Filtering happens on the server. */
    activeCategory: string | null;
}

export default function BlogList({ posts, categories, activeCategory }: BlogListProps) {
    const { language } = useContentLanguage();
    // 한 번 이상 뷰포트에 진입한 글 ID 기억 → 재등장 시 즉시 표시 (Projects 패턴과 동일).
    // ref가 아니라 state인 이유: 아래 목록이 렌더 중에 이 값을 읽는다. ref를 렌더 중
    // 읽으면 동시성 렌더링에서 값이 어긋날 수 있어 React가 금지하는 패턴이다.
    const [visibleIds, setVisibleIds] = useState<ReadonlySet<string>>(() => new Set());

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const seen = entries
                .filter(entry => entry.isIntersecting)
                .map(entry => (entry.target as HTMLElement).dataset.postId)
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
            document.querySelectorAll('#blog-list [data-post-id]')
                .forEach(el => observer.observe(el));
        }, 50);

        return () => {
            observer.disconnect();
            clearTimeout(timeoutId);
        };
        // 카테고리 전환은 soft navigation이라 컴포넌트가 unmount되지 않는다.
        // 이 의존성이 없으면 새로 그려진 카드가 observe되지 않아 opacity-0에 갇힌다.
    }, [activeCategory]);

    return (
        <section id="blog" className="py-24 bg-main relative min-h-screen">
            <div className="max-w-4xl mx-auto px-6">
                <div className="relative mb-16 space-y-4 pt-16">
                    <span className="text-green-400 font-bold tracking-widest text-xs uppercase">Writing</span>
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-stone-100">
                        Tech Blog
                    </h1>
                </div>

                {/* Category Filter — links, so each filtered view has a shareable URL */}
                {categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-10">
                        <Link
                            href="/blog"
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${
                                !activeCategory
                                    ? 'bg-green-400 text-black border-green-400'
                                    : 'bg-transparent text-stone-400 border-stone-700 hover:border-green-500 hover:text-green-400'
                            }`}
                        >
                            All
                        </Link>
                        {categories.map(category => (
                            <Link
                                key={category.id}
                                href={`/blog?category=${encodeURIComponent(category.slug)}`}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${
                                    activeCategory === category.slug
                                        ? 'bg-green-400 text-black border-green-400'
                                        : 'bg-transparent text-stone-400 border-stone-700 hover:border-green-500 hover:text-green-400'
                                }`}
                            >
                                {pick(category, 'name', language)}
                            </Link>
                        ))}
                    </div>
                )}

                {posts.length === 0 ? (
                    <p className="text-stone-500 italic py-20 text-center">No posts yet. Check back soon.</p>
                ) : (
                    <div id="blog-list" className="flex flex-col">
                        {posts.map((post, index) => {
                            const isVisible = visibleIds.has(post.id);
                            return (
                                <Link
                                    key={post.id}
                                    href={`/blog/${encodeURIComponent(post.slug)}`}
                                    data-post-id={post.id}
                                    className={`group flex items-start justify-between gap-6 py-8 border-t border-highlight last:border-b transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                                    style={{ transitionDelay: isVisible ? '0ms' : `${index * 80}ms` }}
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-3 mb-3 text-[11px] font-mono text-stone-500 uppercase tracking-wider">
                                            <span>{formatPostDate(post.date)}</span>
                                            <span className="text-stone-700">·</span>
                                            <span>{readingMinutes(post, language)} min read</span>
                                        </div>
                                        <h2 lang={pickLang(post, 'title', language)} className="text-xl md:text-2xl font-display font-bold text-stone-200 group-hover:text-green-400 transition-colors leading-snug mb-2">
                                            {pick(post, 'title', language)}
                                        </h2>
                                        <p lang={pickLang(post, 'description', language)} className="text-stone-400 text-sm leading-relaxed line-clamp-2 mb-3">
                                            {pick(post, 'description', language)}
                                        </p>
                                        {post.categories.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {post.categories.map(category => (
                                                    <span
                                                        key={category.id}
                                                        className="inline-block text-[10px] font-mono text-green-400 bg-green-900/40 border border-green-600/60 rounded px-2 py-0.5"
                                                    >
                                                        {pick(category, 'name', language)}
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
