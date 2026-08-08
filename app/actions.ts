'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Project, Post, Category } from '@/types/database.types'
import { parseGithubPath } from '@/utils/github'
import { postSlug } from '@/utils/post'

// --- Analytics Actions ---

export async function incrementView() {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase.rpc('increment_view', { target_date: today })

    if (error) {
        // Fallback if RPC not yet created: safe upsert (may undercount under heavy concurrency)
        console.warn('increment_view RPC not found, falling back:', error.message)
        await supabase
            .from('daily_stats')
            .upsert({ date: today, views: 1 }, { onConflict: 'date', ignoreDuplicates: true })
    }
}

export async function getAnalyticsData() {
    const supabase = await createClient()
    // Last 7 calendar days in UTC, matching the dates incrementView writes.
    const days = [...Array(7)].map((_, i) => {
        const d = new Date()
        d.setUTCDate(d.getUTCDate() - (6 - i))
        return d.toISOString().split('T')[0]
    })

    const { data, error } = await supabase
        .from('daily_stats')
        .select('date, views')
        .gte('date', days[0])
        .order('date', { ascending: true })

    if (error) {
        console.error('Error fetching analytics:', error)
        return []
    }

    // Days without visits have no row; fill them with 0 so the chart always spans a full week.
    const viewsByDate = new Map(data.map(d => [d.date, d.views]))
    return days.map(date => ({ date, views: viewsByDate.get(date) ?? 0 }))
}

// --- Fetch Actions ---



export async function getProjects() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching projects:', error)
        return []
    }
    return data as Project[]
}

// Joined shape used by every post query, so `post.category` is always available.
const POST_SELECT = '*, category:categories(id, name, slug)'

export async function getCategories() {
    const supabase = await createClient()
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
 * Published posts, newest first. Passing a category slug narrows the list.
 * Called with no argument it must behave exactly as before — the sitemap and
 * the prev/next links on a post page both rely on the full list.
 */
export async function getPosts(categorySlug?: string) {
    const supabase = await createClient()

    let categoryId: string | null = null
    if (categorySlug) {
        // Resolve slug → id first rather than filtering on the embedded resource;
        // an unknown slug should yield an empty list, not every post.
        const { data: category } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', categorySlug)
            .maybeSingle()

        if (!category) return []
        categoryId = category.id
    }

    let query = supabase
        .from('posts')
        .select(POST_SELECT)
        .eq('published', true)

    if (categoryId) query = query.eq('category_id', categoryId)

    const { data, error } = await query.order('date', { ascending: false })

    if (error) {
        console.error('Error fetching posts:', error)
        return []
    }
    return data as Post[]
}

export async function getPostBySlug(slug: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .eq('slug', slug)
        .eq('published', true)
        .single()

    if (error) {
        // Not found is an expected case; don't spam the log for it.
        if (error.code !== 'PGRST116') console.error('Error fetching post:', error)
        return null
    }
    return data as Post
}

// Admin-only: includes unpublished drafts
export async function getAllPostsAdmin() {
    if (!(await isAuthenticated())) return []

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .order('date', { ascending: false })

    if (error) {
        console.error('Error fetching posts (admin):', error)
        return []
    }
    return data as Post[]
}

// --- Mutation Actions (Admin) ---

// Helper to check authentication
async function isAuthenticated() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}



export async function addProject(formData: FormData) {
    if (!(await isAuthenticated())) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const date = formData.get('date') as string
    const stack = (formData.get('stack') as string).split(',').map(s => s.trim())
    const github_link = formData.get('github_link') as string
    const content = formData.get('content') as string

    const { error } = await supabase
        .from('projects')
        .insert({ title, description, date, stack, github_link, content })

    if (error) {
        console.error('Error adding project:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/admin/projects')
    return { success: true }
}

export async function updateProject(formData: FormData) {
    if (!(await isAuthenticated())) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    const id = formData.get('id') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const date = formData.get('date') as string
    const stack = (formData.get('stack') as string).split(',').map(s => s.trim())
    const github_link = formData.get('github_link') as string
    const content = formData.get('content') as string

    const { error } = await supabase
        .from('projects')
        .update({ title, description, date, stack, github_link, content })
        .eq('id', id)

    if (error) {
        console.error('Error updating project:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/admin/projects')
    return { success: true }
}

export async function deleteProject(id: string) {
    if (!(await isAuthenticated())) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting project:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/admin/projects')
    return { success: true }
}

// --- Blog Post Mutations (Admin) ---

function parsePostForm(formData: FormData) {
    const title = formData.get('title') as string
    // URL slug must be ASCII so `<Link>` hrefs don't double-encode on soft nav.
    // Fall back to the title, then a random suffix if nothing survives (e.g. Korean-only title).
    const rawSlug = (formData.get('slug') as string).trim() || title
    let slug = postSlug(rawSlug)
    if (!slug) slug = `post-${Math.random().toString(36).slice(2, 8)}`
    const description = formData.get('description') as string
    const date = formData.get('date') as string
    // Empty select value means "uncategorized" — the FK column is nullable.
    const category_id = (formData.get('category_id') as string) || null
    const content = formData.get('content') as string
    const published = formData.get('published') === 'on' || formData.get('published') === 'true'
    return { title, slug, description, date, category_id, content, published }
}

export async function addPost(formData: FormData) {
    if (!(await isAuthenticated())) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()
    const { error } = await supabase.from('posts').insert(parsePostForm(formData))

    if (error) {
        console.error('Error adding post:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/blog')
    revalidatePath('/admin/posts')
    return { success: true }
}

export async function updatePost(formData: FormData) {
    if (!(await isAuthenticated())) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()
    const id = formData.get('id') as string
    const { error } = await supabase
        .from('posts')
        .update(parsePostForm(formData))
        .eq('id', id)

    if (error) {
        console.error('Error updating post:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/blog')
    revalidatePath('/admin/posts')
    return { success: true }
}

export async function deletePost(id: string) {
    if (!(await isAuthenticated())) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()
    const { error } = await supabase.from('posts').delete().eq('id', id)

    if (error) {
        console.error('Error deleting post:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/blog')
    revalidatePath('/admin/posts')
    return { success: true }
}

// --- Category Mutations (Admin) ---

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
    // posts.category_id is ON DELETE SET NULL, so posts survive as uncategorized.
    const { error } = await supabase.from('categories').delete().eq('id', id)

    if (error) {
        console.error('Error deleting category:', error)
        return { success: false, error: error.message }
    }

    revalidateCategories()
    return { success: true }
}

export async function fetchGithubRepo(url: string) {
    try {
        const parsed = parseGithubPath(url)

        if (!parsed) {
            console.error('Invalid URL format:', url);
            return { success: false, error: 'Invalid URL format' };
        }

        const owner = encodeURIComponent(parsed.owner)
        const repo = encodeURIComponent(parsed.repo)

        // 1. Fetch Repo Info
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: {
                'User-Agent': 'Portfolio-App',
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!repoRes.ok) {
            const errorText = await repoRes.text();
            console.error('GitHub API Error:', repoRes.status, errorText);
            return { success: false, error: `Repository not found (${owner}/${repo}). Status: ${repoRes.status}` };
        }
        const repoData = await repoRes.json();

        // 2. Fetch README
        const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
            headers: {
                'User-Agent': 'Portfolio-App',
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        let readmeContent = '';
        if (readmeRes.ok) {
            const readmeData = await readmeRes.json();
            // Use Buffer for decoding in Node.js environment
            readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
        }

        return {
            success: true,
            data: {
                title: repoData.name,
                description: repoData.description || '',
                date: new Date(repoData.pushed_at).toISOString().slice(0, 7).replace('-', '.'), // YYYY.MM
                content: readmeContent
            }
        };

    } catch (error) {
        console.error('GitHub Fetch Error:', error);
        return { success: false, error: 'Failed to fetch data' };
    }
}
