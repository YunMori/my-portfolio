'use server'

// 이력서 버전 관리 — 불변 스냅샷 이력.
//
// 브랜치 시절의 "프리셋"(이름당 1행 upsert, 선택 조합만 저장)을 대체한다. 프리셋은 아카이브를
// 고치면 과거에 뽑은 이력서 내용까지 따라 바뀌었지만, 버전은 저장 시점의 ResumeData 전체를
// snapshot에 동결하므로 "그때 제출한 그 이력서"가 그대로 남는다.
// RLS(소유자 전용)가 이중 방어. See supabase/migrations/20260816_02_resume_versions.sql.
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { isAuthenticated } from '@/utils/auth'
import { ResumeVersion } from '@/types/database.types'
import type { ResumeSelections, ResumeData } from '@/utils/resume/buildResumeData'

export async function getVersions(): Promise<ResumeVersion[]> {
    if (!(await isAuthenticated())) return []

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('resume_versions')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching resume versions:', error)
        return []
    }
    return data as ResumeVersion[]
}

/**
 * 현재 빌더 상태를 새 버전으로 저장한다.
 *
 * 프리셋과 달리 같은 이름이어도 덮어쓰지 않고 **항상 새 행을 insert** 한다 — 버전은
 * 불변이어야 이력으로서 의미가 있기 때문. version_no는 max+1로 매기는데, 그 사이 다른
 * 탭에서 저장이 끼어들면 (user_id, version_no) UNIQUE 제약이 두 번째를 막는다.
 * 단일 관리자 전제라 실제로 부딪힐 일은 사실상 없다.
 */
export async function saveVersion(
    label: string,
    note: string,
    selections: ResumeSelections,
    snapshot: ResumeData,
) {
    if (!(await isAuthenticated())) return { success: false, error: 'Unauthorized' }

    const supabase = await createClient()

    const { data: latest } = await supabase
        .from('resume_versions')
        .select('version_no')
        .order('version_no', { ascending: false })
        .limit(1)
        .maybeSingle()

    const versionNo = (latest?.version_no ?? 0) + 1

    const { data, error } = await supabase
        .from('resume_versions')
        .insert({
            version_no: versionNo,
            label: label.trim() || null,
            note: note.trim() || null,
            selections,
            snapshot,
        })
        .select()
        .single()

    if (error) {
        console.error('Error saving resume version:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/resume')
    return { success: true, version: data as ResumeVersion }
}

// 라벨/메모는 사후 수정 가능. snapshot과 selections는 손대지 않는다 (불변).
export async function updateVersionMeta(id: string, label: string, note: string) {
    if (!(await isAuthenticated())) return { success: false, error: 'Unauthorized' }

    const supabase = await createClient()
    const { error } = await supabase
        .from('resume_versions')
        .update({ label: label.trim() || null, note: note.trim() || null })
        .eq('id', id)

    if (error) {
        console.error('Error updating resume version meta:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/resume')
    return { success: true }
}

export async function deleteVersion(id: string) {
    if (!(await isAuthenticated())) return { success: false, error: 'Unauthorized' }

    const supabase = await createClient()
    const { error } = await supabase.from('resume_versions').delete().eq('id', id)

    if (error) {
        console.error('Error deleting resume version:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/resume')
    return { success: true }
}
