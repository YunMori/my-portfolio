'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { Project, Profile } from '@/types/database.types'

// --- Fetch Actions ---

export async function getProfile() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('profile')
        .select('*')
        .single()

    if (error) {
        console.error('Error fetching profile:', error)
        return null
    }
    return data as Profile
}

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

export async function updateProfile(formData: FormData) {
    if (!(await isAuthenticated())) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    const profileData: Partial<Profile> = {
        name: formData.get('name') as string,
        role: formData.get('role') as string,
        bio: formData.get('bio') as string,
    }

    // Handle Image Upload
    const avatarFile = formData.get('avatar') as File;
    if (avatarFile && avatarFile.size > 0 && avatarFile.name !== 'undefined') {
        const fileName = `avatar-${Date.now()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('images')
            .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) {
            console.error('Upload Error:', uploadError);
            // Proceeding without image update if fail, or return error? 
            // Let's log and continue for now or return error.
        } else {
            // Get Public URL
            const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
            profileData.avatar_url = publicUrl;
        }
    }

    const { error } = await supabase
        .from('profile')
        .update(profileData)
        .neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) {
        console.error('Error updating profile:', error)
        return { success: false, error }
    }

    revalidatePath('/')
    return { success: true }
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
