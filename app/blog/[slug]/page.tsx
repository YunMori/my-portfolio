import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPostSummaries, getPostBySlug } from '@/app/actions/posts'
import PostArticle from '@/components/blog/PostArticle'

/**
 * Prerender every published post at build time. Combined with the cookie-free
 * public Supabase client, this makes post pages static — a visitor reads HTML
 * off the CDN instead of triggering a database query, and `revalidatePath` in
 * the admin actions refreshes them on publish.
 */
export async function generateStaticParams() {
    const posts = await getPostSummaries()
    return posts.map(post => ({ slug: post.slug }))
}

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params
    const post = await getPostBySlug(slug)
    if (!post) return { title: 'Not Found | Morifolio' }

    // Metadata is built on the server, which cannot know the reader's chosen
    // content language — there is no locale in the URL. Prefer the English
    // translation so it lines up with <html lang="en">, falling back to the original.
    const title = post.title_en || post.title
    const description = post.description_en || post.description

    return {
        title: `${title} | Morifolio`,
        description,
        openGraph: { title, description, type: 'article' },
    }
}

export default async function PostPage(
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params
    const post = await getPostBySlug(slug)
    if (!post) notFound()

    // Prev/next from the published, date-desc ordered list. Summaries only —
    // the links need a slug and a title, not every post's markdown body.
    const posts = await getPostSummaries()
    const idx = posts.findIndex(p => p.slug === slug)
    const newer = idx > 0 ? posts[idx - 1] : null // more recent
    const older = idx >= 0 && idx < posts.length - 1 ? posts[idx + 1] : null

    return (
        <article className="bg-main min-h-screen pt-28 pb-24">
            <PostArticle post={post} older={older} newer={newer} />
        </article>
    )
}
