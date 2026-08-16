'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createPublicClient } from '@/utils/supabase/public'
import { isAuthenticated } from '@/utils/auth'
import { Post, PostListItem, PostAdminListItem, PostSummary, PostCategory } from '@/types/database.types'
import { postSlug, readingTime } from '@/utils/post'
import { optionalText } from '@/utils/form'

// Joined shape used by every post query, so `post.categories` is always available.
// `*` picks up the `_en` translation columns automatically; the category embed
// lists them explicitly, so `name_en` has to be named here.
const POST_SELECT = '*, post_categories(category:categories(id, name, name_en, slug, sort_order))'

// Same join, but with the markdown bodies named out. The admin list renders
// title/slug/date/description and nothing else, so shipping `content` +
// `content_en` for every post put the whole blog through the RSC payload *and*
// again through client-component props. The editor pulls one post's body from
// getPostForEdit() when you click Edit — the same reasoning as toListItem()
// below, which the public list has always used.
const POST_ADMIN_LIST_SELECT =
    'id, title, title_en, slug, description, description_en, published, date, created_at,' +
    ' post_categories(category:categories(id, name, name_en, slug, sort_order))'

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
 *
 * `content_en` goes the same way — otherwise adding translations would double the
 * list payload for a body the list never shows. Both estimates are sent instead,
 * two integers rather than two markdown bodies, so the list agrees with what the
 * post page computes from whichever translation the reader ends up on.
 */
function toListItem(post: Post): PostListItem {
    const { content, content_en, ...rest } = post
    return {
        ...rest,
        readingMinutes: readingTime(content),
        readingMinutesEn: content_en ? readingTime(content_en) : null,
    }
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
        //
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
        .select('slug, title, title_en, date, created_at')
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

// Admin-only: includes unpublished drafts. No markdown bodies — see POST_ADMIN_LIST_SELECT.
export async function getAllPostsAdmin(): Promise<PostAdminListItem[]> {
    if (!(await isAuthenticated())) return []

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('posts')
        .select(POST_ADMIN_LIST_SELECT)
        .order('date', { ascending: false })

    if (error) {
        console.error('Error fetching posts (admin):', error)
        return []
    }
    return (data as unknown as PostRow[]).map(normalizePost) as unknown as PostAdminListItem[]
}

// Admin-only: the full row for the edit form, fetched when a post is opened.
export async function getPostForEdit(id: string): Promise<Post | null> {
    if (!(await isAuthenticated())) return null

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .eq('id', id)
        .maybeSingle()

    if (error) {
        console.error('Error fetching post for edit:', error)
        return null
    }
    return data ? normalizePost(data as PostRow) : null
}

// --- Mutations (Admin) ---

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
    // Optional English translations; null means "fall back to the Korean original".
    const title_en = optionalText(formData, 'title_en')
    const description_en = optionalText(formData, 'description_en')
    const content_en = optionalText(formData, 'content_en')
    return {
        fields: {
            title, slug, description, date, content, published,
            title_en, description_en, content_en,
        },
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
