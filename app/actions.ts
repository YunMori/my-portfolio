'use server'

import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'
import { createPublicClient } from '@/utils/supabase/public'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Project, Post, PostListItem, PostSummary, Category, PostCategory } from '@/types/database.types'
import { parseGithubPath } from '@/utils/github'
import { postSlug, readingTime } from '@/utils/post'

// --- Analytics Actions ---

export async function incrementView() {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase.rpc('increment_view', { target_date: today })

    if (error) {
        // Fallback if the RPC is missing (see supabase/migrations/20260809_01_analytics_rpc.sql).
        // Read-modify-write, so it may undercount under concurrency — but unlike the
        // previous `ignoreDuplicates` upsert it does not silently drop every view
        // after the day's first one.
        console.warn('increment_view RPC failed, falling back:', error.message)
        const { data: row } = await supabase
            .from('daily_stats')
            .select('views')
            .eq('date', today)
            .maybeSingle()

        await supabase
            .from('daily_stats')
            .upsert({ date: today, views: (row?.views ?? 0) + 1 }, { onConflict: 'date' })
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
    const supabase = createPublicClient()
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

// Joined shape used by every post query, so `post.categories` is always available.
const POST_SELECT = '*, post_categories(category:categories(id, name, slug, sort_order))'

type PostRow = Record<string, unknown> & {
    post_categories?: ({ category: PostCategory | null } | null)[] | null
}

/**
 * Flattens the post_categories join into a plain `categories` array and drops the
 * raw join rows, so nothing downstream has to know the table exists.
 */
function normalizePost(row: PostRow): Post {
    const { post_categories, ...rest } = row
    const categories = (post_categories ?? [])
        .map(link => link?.category)
        .filter((c): c is PostCategory => !!c)
        // Same ordering as the blog filter row, so chips read consistently.
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))

    return { ...(rest as Omit<Post, 'categories'>), categories }
}

/**
 * Drops the markdown body and replaces it with the one number the list actually
 * renders. `content` is 30KB across the current posts and grows with every new
 * one; the reading-time estimate it feeds is a single integer, so computing it
 * here keeps that payload on the server.
 */
function toListItem(post: Post): PostListItem {
    const { content, ...rest } = post
    return { ...rest, readingMinutes: readingTime(content) }
}

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
 * Published posts for the blog list, newest first, with categories and a
 * reading-time estimate but no markdown body. Passing a category slug narrows
 * the list. For callers that only need slugs and titles, use getPostSummaries().
 */
export async function getPosts(categorySlug?: string): Promise<PostListItem[]> {
    const supabase = createPublicClient()

    let postIds: string[] | null = null
    if (categorySlug) {
        // Collect matching post ids up front instead of filtering the embed on the
        // posts query with `!inner`. An inner join + eq would trim each post's
        // embedded array down to the one matching category, so cards would show a
        // single chip. Resolving the slug through an inner-joined embed here keeps
        // it to one round trip, and an unknown slug yields no rows — so it falls
        // through to an empty list rather than matching every post.
        // Cast because the hand-written Database type carries no relationship
        // metadata, so supabase-js cannot infer the shape of the embedded select.
        const { data: links } = await supabase
            .from('post_categories')
            .select('post_id, categories!inner(slug)')
            .eq('categories.slug', categorySlug)
            .overrideTypes<{ post_id: string }[]>()

        postIds = (links ?? []).map(l => l.post_id)
        if (postIds.length === 0) return []
    }

    let query = supabase
        .from('posts')
        .select(POST_SELECT)
        .eq('published', true)

    if (postIds) query = query.in('id', postIds)

    const { data, error } = await query.order('date', { ascending: false })

    if (error) {
        console.error('Error fetching posts:', error)
        return []
    }
    return (data as PostRow[]).map(normalizePost).map(toListItem)
}

/**
 * Published posts, newest first, without the markdown body or the category join.
 * For callers that only need to enumerate posts — prev/next links and the
 * sitemap — where `getPosts()` would pull every post's full content across the
 * wire on every render.
 */
export async function getPostSummaries(): Promise<PostSummary[]> {
    const supabase = createPublicClient()
    const { data, error } = await supabase
        .from('posts')
        .select('slug, title, date, created_at')
        .eq('published', true)
        .order('date', { ascending: false })

    if (error) {
        console.error('Error fetching post summaries:', error)
        return []
    }
    return data as PostSummary[]
}

export async function getPostBySlug(slug: string) {
    const supabase = createPublicClient()
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
    return normalizePost(data as PostRow)
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
    return (data as PostRow[]).map(normalizePost)
}

// --- Mutation Actions (Admin) ---

/**
 * The signed-in user, or null.
 *
 * `getUser()` validates the token against the Supabase Auth server rather than
 * trusting the cookie, so it is a network round trip. A single admin page used
 * to make three of them — middleware, the admin layout, and whichever fetcher
 * the page called. React's `cache` collapses every call within one request into
 * one, leaving the middleware's check as the only separate one.
 */
export const getCurrentUser = cache(async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
})

async function isAuthenticated() {
    return !!(await getCurrentUser())
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
    // `date` is a real date column now, so an empty field has to become NULL —
    // posting '' would be rejected as an invalid date literal.
    const date = (formData.get('date') as string) || null
    const content = formData.get('content') as string
    const published = formData.get('published') === 'on' || formData.get('published') === 'true'
    // Category links live in a separate table, so they are returned alongside the
    // column payload rather than inside it — inserting them would fail on an
    // unknown column. No checkboxes ticked means "uncategorized".
    const category_ids = (formData.getAll('category_id') as string[]).filter(Boolean)
    return {
        fields: { title, slug, description, date, content, published },
        category_ids,
    }
}

/**
 * Replaces a post's category links wholesale. Not transactional with the post
 * write itself — matching the rest of this single-admin app, a failure here is
 * surfaced as an error rather than rolled back.
 */
async function setPostCategories(
    supabase: Awaited<ReturnType<typeof createClient>>,
    postId: string,
    categoryIds: string[]
) {
    const { error: deleteError } = await supabase
        .from('post_categories')
        .delete()
        .eq('post_id', postId)

    if (deleteError) return deleteError
    if (categoryIds.length === 0) return null

    const { error: insertError } = await supabase
        .from('post_categories')
        .insert(categoryIds.map(category_id => ({ post_id: postId, category_id })))

    return insertError
}

export async function addPost(formData: FormData) {
    if (!(await isAuthenticated())) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()
    const { fields, category_ids } = parsePostForm(formData)
    const { data, error } = await supabase
        .from('posts')
        .insert(fields)
        .select('id')
        .single()

    if (error) {
        console.error('Error adding post:', error)
        return { success: false, error: error.message }
    }

    const linkError = await setPostCategories(supabase, data.id, category_ids)
    if (linkError) {
        console.error('Error linking post categories:', linkError)
        return { success: false, error: `Post saved, but categories failed: ${linkError.message}` }
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
    const { fields, category_ids } = parsePostForm(formData)
    const { error } = await supabase
        .from('posts')
        .update(fields)
        .eq('id', id)

    if (error) {
        console.error('Error updating post:', error)
        return { success: false, error: error.message }
    }

    const linkError = await setPostCategories(supabase, id, category_ids)
    if (linkError) {
        console.error('Error linking post categories:', linkError)
        return { success: false, error: `Post saved, but categories failed: ${linkError.message}` }
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
