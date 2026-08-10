import { Metadata } from 'next'
import { getPosts } from '@/app/actions/posts'
import { getCategories } from '@/app/actions/categories'
import BlogList from '@/components/blog/BlogList'

type BlogPageProps = {
    searchParams: Promise<{ category?: string }>
}

export async function generateMetadata({ searchParams }: BlogPageProps): Promise<Metadata> {
    const { category: categorySlug } = await searchParams

    // Metadata is generated on the server, which cannot know the visitor's chosen
    // content language — there is no locale in the URL. It stays English, matching
    // <html lang="en"> and the rest of the chrome.
    const base: Metadata = {
        title: 'Blog | Morifolio',
        description: 'Notes from building things — architecture, frontend, and retrospectives.',
        openGraph: {
            title: 'Blog | Yun Jong Seo',
            description: 'Notes from building things.',
            type: 'website',
        },
    }

    if (!categorySlug) return base

    // A filtered list is a shareable URL, so give it its own title.
    const category = (await getCategories()).find(c => c.slug === categorySlug)
    if (!category) return base

    const label = category.name_en || category.name
    const title = `${label} | Blog | Morifolio`
    const description = `Posts filed under ${label}.`
    return {
        ...base,
        title,
        description,
        openGraph: { ...base.openGraph, title, description },
    }
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
    const { category } = await searchParams
    const [posts, categories] = await Promise.all([getPosts(category), getCategories()])

    return <BlogList posts={posts} categories={categories} activeCategory={category ?? null} />
}
