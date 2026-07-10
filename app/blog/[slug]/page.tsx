import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPosts, getPostBySlug } from '@/app/actions'
import { extractHeadings, readingTime } from '@/utils/post'
import PostBody from '@/components/PostBody'

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params
    const post = await getPostBySlug(slug)
    if (!post) return { title: 'Not Found | Morifolio' }

    return {
        title: `${post.title} | Morifolio`,
        description: post.description,
        openGraph: {
            title: post.title,
            description: post.description,
            type: 'article',
        },
    }
}

export default async function PostPage(
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params
    const post = await getPostBySlug(slug)
    if (!post) notFound()

    const headings = extractHeadings(post.content)

    // Prev/next from the published, date-desc ordered list.
    const posts = await getPosts()
    const idx = posts.findIndex(p => p.slug === slug)
    const newer = idx > 0 ? posts[idx - 1] : null // more recent
    const older = idx >= 0 && idx < posts.length - 1 ? posts[idx + 1] : null

    return (
        <article className="bg-main min-h-screen pt-28 pb-24">
            <div className="max-w-3xl mx-auto px-6">
                {/* Back link */}
                <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-green-400 transition-colors mb-10">
                    <i className="fa-solid fa-arrow-left"></i> Blog
                </Link>

                {/* Header */}
                <header className="mb-10">
                    <div className="flex items-center gap-3 text-[11px] font-mono text-stone-500 uppercase tracking-wider mb-4">
                        <span>{post.date}</span>
                        <span className="text-stone-700">·</span>
                        <span>{readingTime(post.content)}분</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-display font-bold text-stone-100 leading-tight text-balance mb-6">
                        {post.title}
                    </h1>
                    {post.description && (
                        <p className="text-stone-400 text-lg leading-relaxed">{post.description}</p>
                    )}
                    {(post.tags ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-6">
                            {post.tags.map(tag => (
                                <span key={tag} className="text-[11px] font-mono text-green-400 bg-green-900/40 border border-green-600/60 rounded px-2.5 py-1">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </header>

                {/* Table of Contents */}
                {headings.length > 1 && (
                    <nav className="mb-12 rounded-xl border border-highlight bg-surface/60 p-5">
                        <p className="text-[11px] font-mono uppercase tracking-widest text-stone-500 mb-3">목차</p>
                        <ul className="space-y-1.5 text-sm">
                            {headings.map((h, i) => (
                                <li key={`${h.id}-${i}`} className={h.level === 3 ? 'pl-4' : ''}>
                                    <a href={`#${h.id}`} className="text-stone-400 hover:text-green-400 transition-colors">
                                        {h.text}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                )}

                <div className="section-divider !mx-0 mb-12"></div>

                {/* Body */}
                <PostBody content={post.content} />

                {/* Prev / Next */}
                {(older || newer) && (
                    <nav className="mt-20 pt-10 border-t border-highlight grid sm:grid-cols-2 gap-4">
                        {older ? (
                            <Link href={`/blog/${older.slug}`} className="group rounded-xl border border-highlight hover:border-green-500 bg-surface/50 p-5 transition-colors">
                                <span className="text-[11px] font-mono uppercase tracking-widest text-stone-500">이전 글</span>
                                <p className="mt-2 font-display font-bold text-stone-200 group-hover:text-green-400 transition-colors line-clamp-2">{older.title}</p>
                            </Link>
                        ) : <span />}
                        {newer ? (
                            <Link href={`/blog/${newer.slug}`} className="group rounded-xl border border-highlight hover:border-green-500 bg-surface/50 p-5 transition-colors sm:text-right">
                                <span className="text-[11px] font-mono uppercase tracking-widest text-stone-500">다음 글</span>
                                <p className="mt-2 font-display font-bold text-stone-200 group-hover:text-green-400 transition-colors line-clamp-2">{newer.title}</p>
                            </Link>
                        ) : <span />}
                    </nav>
                )}
            </div>
        </article>
    )
}
