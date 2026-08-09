'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createPublicClient } from '@/utils/supabase/public'
import { isAuthenticated } from '@/utils/auth'
import { Category } from '@/types/database.types'
import { postSlug } from '@/utils/post'

export async function getCategories() {
    const supabase = createPublicClient()
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching categories:', error)
        return []
    }
    return data as Category[]
}

/**
 * How many posts (drafts included) sit in each category, keyed by category id.
 * The categories admin only needs these counts for its delete confirmation;
 * deriving them from getAllPostsAdmin() used to drag every post's markdown body
 * along for the ride. The join table holds two uuids per row instead.
 */
export async function getCategoryPostCounts(): Promise<Record<string, number>> {
    if (!(await isAuthenticated())) return {}

    const supabase = await createClient()
    const { data, error } = await supabase.from('post_categories').select('category_id')

    if (error) {
        console.error('Error fetching category post counts:', error)
        return {}
    }

    return data.reduce<Record<string, number>>((acc, { category_id }) => {
        acc[category_id] = (acc[category_id] ?? 0) + 1
        return acc
    }, {})
}

// --- Mutations (Admin) ---

function parseCategoryForm(formData: FormData) {
    const name = (formData.get('name') as string).trim()
    // Same slug rules as posts: ASCII only, fall back to the name, then random.
    const rawSlug = (formData.get('slug') as string).trim() || name
    let slug = postSlug(rawSlug)
    if (!slug) slug = `category-${Math.random().toString(36).slice(2, 8)}`
    const sort_order = Number(formData.get('sort_order')) || 0
    return { name, slug, sort_order }
}

// Category changes alter the filter row on the public blog, so both paths revalidate.
function revalidateCategories() {
    revalidatePath('/blog')
    revalidatePath('/admin/categories')
    revalidatePath('/admin/posts')
}

export async function addCategory(formData: FormData) {
    if (!(await isAuthenticated())) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()
    const { error } = await supabase.from('categories').insert(parseCategoryForm(formData))

    if (error) {
        console.error('Error adding category:', error)
        return { success: false, error: error.message }
    }

    revalidateCategories()
    return { success: true }
}

export async function updateCategory(formData: FormData) {
    if (!(await isAuthenticated())) {
        return { success: false, error: 'Unauthorized' }
    }

    const id = formData.get('id') as string
    const supabase = await createClient()
    const { error } = await supabase
        .from('categories')
        .update(parseCategoryForm(formData))
        .eq('id', id)

    if (error) {
        console.error('Error updating category:', error)
        return { success: false, error: error.message }
    }

    revalidateCategories()
    return { success: true }
}

export async function deleteCategory(id: string) {
    if (!(await isAuthenticated())) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()
    // post_categories rows are ON DELETE CASCADE, so posts survive and simply lose
    // this one chip.
    const { error } = await supabase.from('categories').delete().eq('id', id)

    if (error) {
        console.error('Error deleting category:', error)
        return { success: false, error: error.message }
    }

    revalidateCategories()
    return { success: true }
}
