import { getBlogPosts } from '@/app/actions'
import BlogManager from '@/components/admin/BlogManager'

export default async function BlogPage() {
    const posts = await getBlogPosts()

    return (
        <div>
            <h1 className="text-3xl font-bold mb-10 text-khaki-500">Manage Blog</h1>
            <BlogManager initialPosts={posts} />
        </div>
    )
}
