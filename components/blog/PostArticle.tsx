'use client'

import Link from 'next/link'
import { Post, PostSummary } from '@/types/database.types'
import { useContentLanguage } from '@/i18n/ContentLanguage'
import { pick, pickLang } from '@/i18n/localize'
import { extractHeadings, formatPostDate, readingTime } from '@/utils/post'
import PostBody from '@/components/blog/PostBody'

type PostArticleProps = {
    post: Post
    /** Previous (older) and next (newer) post in the published, date-desc list. */
    older: PostSummary | null
    newer: PostSummary | null
}

/**
 * Everything on a post page that depends on the reader's content language.
 *
 * The page itself stays a server component so posts keep being prerendered at
 * build time; both language bodies ship inside that static HTML and this picks
 * between them in the browser. Reading time and the table of contents are derived
 * from whichever body is showing, so they never describe the other translation.
 */
export default function PostArticle({ post, older, newer }: PostArticleProps) {
    const { language } = useContentLanguage()

    const title = pick(post, 'title', language)
    const description = pick(post, 'description', language)
    const content = pick(post, 'content', language)
    const headings = extractHeadings(content)
    // What `pick` actually resolved to, which is not the requested language when a
    // post has no translation yet.
    const bodyLang = pickLang(post, 'content', language)

    return (
        <div className="max-w-3xl mx-auto px-6">
            {/* Back link */}
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-green-400 transition-colors mb-10">
                <i className="fa-solid fa-arrow-left"></i> Blog
            </Link>

            {/* Header */}
            <header className="mb-10">
                <div className="flex items-center gap-3 text-[11px] font-mono text-stone-500 uppercase tracking-wider mb-4">
                    <span>{formatPostDate(post.date)}</span>
                    <span className="text-stone-700">·</span>
                    <span>{readingTime(content)} min read</span>
                </div>
                <h1 lang={pickLang(post, 'title', language)} className="text-3xl md:text-5xl font-display font-bold text-stone-100 leading-tight text-balance mb-6">
                    {title}
                </h1>
                {description && (
                    <p lang={pickLang(post, 'description', language)} className="text-stone-400 text-lg leading-relaxed">{description}</p>
                )}
                {post.categories.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2">
                        {post.categories.map(category => (
                            <Link
                                key={category.id}
                                href={`/blog?category=${encodeURIComponent(category.slug)}`}
                                className="inline-block text-[11px] font-mono text-green-400 bg-green-900/40 border border-green-600/60 rounded px-2.5 py-1 hover:border-green-400 hover:bg-green-900/60 transition-colors"
                            >
                                {pick(category, 'name', language)}
                            </Link>
                        ))}
                    </div>
                )}
            </header>

            {/* Table of Contents */}
            {headings.length > 1 && (
                <nav className="mb-12 rounded-xl border border-highlight bg-surface/60 p-5">
                    <p className="text-[11px] font-mono uppercase tracking-widest text-stone-500 mb-3">Contents</p>
                    <ul className="space-y-1.5 text-sm">
                        {headings.map((h, i) => (
                            <li key={`${h.id}-${i}`} className={h.level === 3 ? 'pl-4' : ''}>
                                <a lang={bodyLang} href={`#${h.id}`} className="text-stone-400 hover:text-green-400 transition-colors">
                                    {h.text}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            )}

            <div className="section-divider !mx-0 mb-12"></div>

            {/* Body */}
            <PostBody content={content} lang={bodyLang} />

            {/* Prev / Next */}
            {(older || newer) && (
                <nav className="mt-20 pt-10 border-t border-highlight grid sm:grid-cols-2 gap-4">
                    {older ? (
                        <Link href={`/blog/${encodeURIComponent(older.slug)}`} className="group rounded-xl border border-highlight hover:border-green-500 bg-surface/50 p-5 transition-colors">
                            <span className="text-[11px] font-mono uppercase tracking-widest text-stone-500">Previous</span>
                            <p lang={pickLang(older, 'title', language)} className="mt-2 font-display font-bold text-stone-200 group-hover:text-green-400 transition-colors line-clamp-2">{pick(older, 'title', language)}</p>
                        </Link>
                    ) : <span />}
                    {newer ? (
                        <Link href={`/blog/${encodeURIComponent(newer.slug)}`} className="group rounded-xl border border-highlight hover:border-green-500 bg-surface/50 p-5 transition-colors sm:text-right">
                            <span className="text-[11px] font-mono uppercase tracking-widest text-stone-500">Next</span>
                            <p lang={pickLang(newer, 'title', language)} className="mt-2 font-display font-bold text-stone-200 group-hover:text-green-400 transition-colors line-clamp-2">{pick(newer, 'title', language)}</p>
                        </Link>
                    ) : <span />}
                </nav>
            )}
        </div>
    )
}
