import { getCategories, getAllPostsAdmin } from '@/app/actions'
import CategoryManager from '@/components/admin/CategoryManager'

export default async function CategoriesPage() {
    const [categories, posts] = await Promise.all([getCategories(), getAllPostsAdmin()])

    // Post counts (drafts included) so the delete confirmation can say what it affects.
    const postCounts = posts.reduce<Record<string, number>>((acc, post) => {
        if (post.category_id) acc[post.category_id] = (acc[post.category_id] ?? 0) + 1
        return acc
    }, {})

    return (
        <div>
            <h1 className="text-3xl font-bold mb-10 text-green-500">Manage Categories</h1>
            <CategoryManager initialCategories={categories} postCounts={postCounts} />
        </div>
    )
}
