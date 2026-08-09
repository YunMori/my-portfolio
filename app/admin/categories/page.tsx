import { getCategories, getCategoryPostCounts } from '@/app/actions'
import CategoryManager from '@/components/admin/CategoryManager'

export default async function CategoriesPage() {
    // Post counts (drafts included) so the delete confirmation can say what it
    // affects. A post with several categories counts once toward each of them.
    const [categories, postCounts] = await Promise.all([getCategories(), getCategoryPostCounts()])

    return (
        <div>
            <h1 className="text-3xl font-bold mb-10 text-green-500">Manage Categories</h1>
            <CategoryManager initialCategories={categories} postCounts={postCounts} />
        </div>
    )
}
