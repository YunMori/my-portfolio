import { getAllPostsAdmin, getCategories } from '@/app/actions'
import PostManager from '@/components/admin/PostManager'

export default async function PostsPage() {
    const [posts, categories] = await Promise.all([getAllPostsAdmin(), getCategories()])

    return (
        <div>
            <h1 className="text-3xl font-bold mb-10 text-green-500">Manage Posts</h1>
            <PostManager initialPosts={posts} categories={categories} />
        </div>
    )
}
