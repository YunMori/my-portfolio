'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createPublicClient } from '@/utils/supabase/public'
import { isAuthenticated } from '@/utils/auth'
import { Project } from '@/types/database.types'
import { parseGithubPath } from '@/utils/github'
import { optionalText } from '@/utils/form'

/** Shared by add and update so the two payloads cannot drift apart. */
function parseProjectForm(formData: FormData) {
    return {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        date: formData.get('date') as string,
        stack: (formData.get('stack') as string).split(',').map(s => s.trim()),
        github_link: formData.get('github_link') as string,
        content: formData.get('content') as string,
        // Optional English translations; null means "fall back to the original".
        title_en: optionalText(formData, 'title_en'),
        description_en: optionalText(formData, 'description_en'),
        content_en: optionalText(formData, 'content_en'),
    }
}

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

export async function addProject(formData: FormData) {
    if (!(await isAuthenticated())) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from('projects')
        .insert(parseProjectForm(formData))

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

    const { error } = await supabase
        .from('projects')
        .update(parseProjectForm(formData))
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

/** Prefills the project form from a GitHub repo: name, description, date, README. */
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
