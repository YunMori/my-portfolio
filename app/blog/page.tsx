import { Metadata } from 'next'
import { getPosts, getCategories } from '@/app/actions'
import BlogList from '@/components/BlogList'

type BlogPageProps = {
    searchParams: Promise<{ category?: string }>
}

export async function generateMetadata({ searchParams }: BlogPageProps): Promise<Metadata> {
    const { category: categorySlug } = await searchParams

    const base: Metadata = {
        title: 'Blog | Morifolio',
        description: '개발하며 배우고 정리한 기록들. 아키텍처, 프론트엔드, 회고.',
        openGraph: {
            title: 'Blog | Yun Jong Seo',
            description: '개발하며 배우고 정리한 기록들.',
            type: 'website',
        },
    }

    if (!categorySlug) return base

    // A filtered list is a shareable URL, so give it its own title.
    const category = (await getCategories()).find(c => c.slug === categorySlug)
    if (!category) return base

    const title = `${category.name} | Blog | Morifolio`
    const description = `${category.name} 카테고리의 글 모음.`
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
