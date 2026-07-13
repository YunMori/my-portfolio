'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Project, Post } from '@/types/database.types'
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
    // Get last 7 days
    const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .order('date', { ascending: true })
        .limit(7)

    if (error) {
        console.error('Error fetching analytics:', error)
        return []
    }
    return data
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

export async function getPosts() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('published', true)
        .order('date', { ascending: false })

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
        .select('*')
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
        .select('*')
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



// 프로젝트 이력서 확장 필드 파싱 (resume_platform_migration.sql)
function parseProjectResumeFields(formData: FormData) {
    const str = (name: string) => ((formData.get(name) as string) || '').trim() || null
    return {
        role: str('role'),
        period_start: str('period_start'),
        period_end: str('period_end'),
        tags: ((formData.get('tags') as string) || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
        is_public: formData.get('is_public') === 'on' || formData.get('is_public') === 'true',
        include_in_resume_default:
            formData.get('include_in_resume_default') === 'on' || formData.get('include_in_resume_default') === 'true',
    }
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
        .insert({ title, description, date, stack, github_link, content, ...parseProjectResumeFields(formData) })

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
        .update({ title, description, date, stack, github_link, content, ...parseProjectResumeFields(formData) })
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
    const tags = (formData.get('tags') as string)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    const content = formData.get('content') as string
    const published = formData.get('published') === 'on' || formData.get('published') === 'true'
    return { title, slug, description, date, tags, content, published }
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
