import { Metadata } from 'next'
import { getPosts } from '@/app/actions'
import BlogList from '@/components/BlogList'

export const metadata: Metadata = {
    title: 'Blog | Morifolio',
    description: '개발하며 배우고 정리한 기록들. 아키텍처, 프론트엔드, 회고.',
    openGraph: {
        title: 'Blog | Yun Jong Seo',
        description: '개발하며 배우고 정리한 기록들.',
        type: 'website',
    },
}

export default async function BlogPage() {
    const posts = await getPosts()
    return <BlogList posts={posts} />
}
