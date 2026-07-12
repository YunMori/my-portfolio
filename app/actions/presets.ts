'use server'

// 이력서 프리셋 CRUD — RLS(owner 전용)가 이중 방어
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { ResumePreset, PresetSelections } from '@/types/database.types'

async function isAuthenticated() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
}

export async function getPresets(): Promise<ResumePreset[]> {
    if (!(await isAuthenticated())) return []

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('resume_presets')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching presets:', error)
        return []
    }
    return data as ResumePreset[]
}

// 동일 이름 프리셋이 있으면 덮어쓰기(upsert), 없으면 생성
export async function savePreset(name: string, selections: PresetSelections) {
    if (!(await isAuthenticated())) return { success: false, error: 'Unauthorized' }

    const trimmed = name.trim()
    if (!trimmed) return { success: false, error: '프리셋 이름을 입력하세요' }

    const supabase = await createClient()
    const { data: existing } = await supabase
        .from('resume_presets')
        .select('id')
        .eq('name', trimmed)
        .maybeSingle()

    const { data, error } = existing
        ? await supabase.from('resume_presets').update({ selections }).eq('id', existing.id).select().single()
        : await supabase.from('resume_presets').insert({ name: trimmed, selections }).select().single()

    if (error) {
        console.error('Error saving preset:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/resume')
    return { success: true, preset: data as ResumePreset }
}

export async function deletePreset(id: string) {
    if (!(await isAuthenticated())) return { success: false, error: 'Unauthorized' }

    const supabase = await createClient()
    const { error } = await supabase.from('resume_presets').delete().eq('id', id)

    if (error) {
        console.error('Error deleting preset:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/resume')
    return { success: true }
}
