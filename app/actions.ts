'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { Project, Profile } from '@/types/database.types'

// --- Analytics Actions ---

export async function incrementView() {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    // Upsert: Try to insert, if conflict (date exists), increment views
    // Note: Supabase JS doesn't support 'increment' in upsert directly easily without RPC, 
    // but we can try a simple read-modify-type approach or use RPC if created.
    // For simplicity without simpler RPC: Check existence -> Insert or Update.

    // Simple approach:
    const { data: existing } = await supabase
        .from('daily_stats')
        .select('views')
        .eq('date', today)
        .single()

    if (existing) {
        await supabase
            .from('daily_stats')
            .update({ views: existing.views + 1 })
            .eq('date', today)
    } else {
        await supabase
            .from('daily_stats')
            .insert({ date: today, views: 1 })
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
    const desc = formData.get('desc') as string
    const date = formData.get('date') as string
    const stack = (formData.get('stack') as string).split(',').map(s => s.trim())
    const github_link = formData.get('github_link') as string
    const content = formData.get('content') as string

    const { error } = await supabase
        .from('projects')
        .insert({ title, description: desc, date, stack, github_link, content })

    if (error) {
        console.error('Error adding project:', error)
        return { success: false, error }
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
    const desc = formData.get('desc') as string
    const date = formData.get('date') as string
    const stack = (formData.get('stack') as string).split(',').map(s => s.trim())
    const github_link = formData.get('github_link') as string
    const content = formData.get('content') as string

    const { error } = await supabase
        .from('projects')
        .update({ title, description: desc, date, stack, github_link, content })
        .eq('id', id)

    if (error) {
        console.error('Error updating project:', error)
        return { success: false, error }
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
        return { success: false, error }
    }

    revalidatePath('/')
    revalidatePath('/admin/projects')
    return { success: true }
}

export async function fetchGithubRepo(url: string) {
    try {
        let path = url.trim();
        // 1. Remove trailing slashes
        path = path.replace(/\/+$/, "");
        // 2. Remove protocol (http:// or https://)
        path = path.replace(/^https?:\/\//, "");
        // 3. Remove domain (www.github.com/ or github.com/)
        path = path.replace(/^(www\.)?github\.com\//, "");
        // 4. Remove .git extension if present
        path = path.replace(/\.git$/, "");

        const parts = path.split('/').filter(Boolean);

        let owner, repo;
        if (parts.length >= 2) {
            owner = parts[0];
            repo = parts[1];
        }

        if (!owner || !repo) {
            console.error('Invalid URL format derived:', path);
            return { success: false, error: 'Invalid URL format' };
        }

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
