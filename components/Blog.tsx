'use client'

import { BlogPost } from '@/types/database.types';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { useLanguage } from '@/context/LanguageContext';

interface BlogProps {
    posts: BlogPost[];
}

export default function Blog({ posts }: BlogProps) {
    const { t } = useLanguage();
    const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedPost(null);
        };
        if (selectedPost) document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [selectedPost]);

    if (posts.length === 0) return null;

    return (
        <section id="blog" className="py-24 bg-surface/30 relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-20 space-y-4 text-center md:text-left">
                    <span className="text-khaki-500 font-bold tracking-widest text-xs uppercase">{t('blog.header')}</span>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-stone-100">
                        {t('blog.title')}
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post, index) => (
                        <div
                            key={post.id}
                            className="group rounded-2xl overflow-hidden bg-surface border border-highlight hover:border-khaki-500 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer fade-in-section opacity-0 translate-y-5 flex flex-col h-full"
                            style={{ transitionDelay: `${index * 100}ms` }}
                            onClick={() => setSelectedPost(post)}
                        >
                            <div className="p-8 flex flex-col flex-grow">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-xs font-mono text-stone-500">
                                        {t('blog.published')} {new Date(post.published_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-stone-200 group-hover:text-khaki-500 transition-colors mb-3">
                                    {post.title}
                                </h3>
                                <p className="text-stone-400 text-sm leading-relaxed mb-6 flex-grow">
                                    {post.description}
                                </p>
                                {post.tags && post.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {post.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="bg-stone-800 border border-stone-700 text-[10px] px-2 py-1 rounded-full text-stone-400">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <button className="text-xs font-bold text-stone-300 hover:text-white flex items-center gap-2 group-hover:gap-3 transition-all mt-auto">
                                    {t('blog.readMore')} <i className="fa-solid fa-arrow-right text-khaki-500"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Blog Post Modal */}
            {selectedPost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="blog-modal-title">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedPost(null)}></div>
                    <div className="relative bg-[#1a1917] w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-stone-800 shadow-2xl p-8 md:p-12 animate-in fade-in zoom-in duration-300">
                        <button
                            onClick={() => setSelectedPost(null)}
                            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-white flex items-center justify-center transition-colors z-50"
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>

                        <div className="mb-8">
                            <span className="text-khaki-500 text-xs font-bold tracking-widest uppercase mb-2 block">
                                {t('blog.published')} {new Date(selectedPost.published_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                            <h2 id="blog-modal-title" className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
                                {selectedPost.title}
                            </h2>
                            {selectedPost.tags && selectedPost.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {selectedPost.tags.map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-stone-800 rounded-full text-xs text-stone-300 border border-stone-700">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="prose prose-invert prose-stone max-w-none">
                            {selectedPost.content ? (
                                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{selectedPost.content}</ReactMarkdown>
                            ) : (
                                <p className="text-stone-500 italic">{t('blog.noContent')}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
