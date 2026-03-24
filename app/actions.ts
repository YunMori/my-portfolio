'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { Project } from '@/types/database.types'
import { parseGithubPath } from '@/utils/github'

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

// --- Mutation Actions (Admin) ---

// Helper to check authentication
async function isAuthenticated() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
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

export async function fetchGithubRepo(url: string) {
    try {
        const parsed = parseGithubPath(url)

        if (!parsed) {
            console.error('Invalid URL format:', url);
            return { success: false, error: 'Invalid URL format' };
        }

        const { owner, repo } = parsed

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
