'use server'

// 이력서 아카이브 CRUD — 카테고리 레지스트리(utils/resume/config.ts)를 스키마로 삼는
// 제네릭 액션들. 카테고리마다 액션을 따로 두지 않는 대신, 클라이언트가 보낸 카테고리 키는
// 반드시 getCategory()로 화이트리스트 검증한다 (테이블명을 그대로 신뢰하면 안 되므로).
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { isAuthenticated } from '@/utils/auth'
import { getCategory, FieldDef } from '@/utils/resume/config'
import { Profile, PersonalDetails } from '@/types/database.types'

/**
 * 카테고리 필드 정의에 따라 FormData → DB 레코드로 파싱.
 *
 * add/update가 공유하므로 두 페이로드가 어긋날 수 없다 (posts/projects의 parseXForm과 같은 이유).
 * utils/form.ts의 optionalText()와 목적이 겹치지만, 이쪽은 컬럼 목록이 런타임에 정해지는
 * FieldDef[] 기반이라 타입별 분기가 필요해 따로 둔다.
 */
function parseItemForm(fields: FieldDef[], formData: FormData) {
    const record: Record<string, unknown> = {}

    for (const field of fields) {
        const raw = (formData.get(field.name) as string | null) ?? ''
        const value = raw.trim()

        switch (field.type) {
            case 'bullets':
                record[field.name] = value
                    ? value.split('\n').map(s => s.trim()).filter(Boolean)
                    : []
                break
            case 'number': {
                const n = parseInt(value, 10)
                record[field.name] = Number.isNaN(n) ? null : n
                break
            }
            default:
                record[field.name] = value || null
        }
    }

    return record
}

// 이력서 기능은 어드민 전용이라 공개 경로('/')는 재검증하지 않는다.
function revalidateResumePaths(categoryKey: string) {
    revalidatePath(`/admin/archive/${categoryKey}`)
}

// --- 제네릭 CRUD ---

export async function getResumeItemsAdmin(categoryKey: string) {
    const category = getCategory(categoryKey)
    if (!category || !(await isAuthenticated())) return []

    const supabase = await createClient()
    const { data, error } = await supabase
        .from(category.table)
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

    if (error) {
        console.error(`Error fetching ${category.table} (admin):`, error)
        return []
    }
    return data
}

export async function addResumeItem(categoryKey: string, formData: FormData) {
    const category = getCategory(categoryKey)
    if (!category) return { success: false, error: 'Unknown category' }
    if (!(await isAuthenticated())) return { success: false, error: 'Unauthorized' }

    const supabase = await createClient()
    const record = parseItemForm(category.fields, formData)

    // 기존 순서를 유지하면서 가장 큰 순서 값 다음에 추가한다.
    // 삭제로 순서에 빈칸이 생겨도 새 자료가 중간에 끼어들지 않는다.
    const { data: lastItem, error: orderError } = await supabase
        .from(category.table)
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .maybeSingle()
    if (orderError) return { success: false, error: orderError.message }
    record.display_order = (lastItem?.display_order ?? -1) + 1
    record.is_public = false

    const { error } = await supabase.from(category.table).insert(record)

    if (error) {
        console.error(`Error adding ${category.table}:`, error)
        return { success: false, error: error.message }
    }

    revalidateResumePaths(categoryKey)
    return { success: true }
}

export async function updateResumeItem(categoryKey: string, formData: FormData) {
    const category = getCategory(categoryKey)
    if (!category) return { success: false, error: 'Unknown category' }
    if (!(await isAuthenticated())) return { success: false, error: 'Unauthorized' }

    const supabase = await createClient()
    const id = formData.get('id') as string
    const record = parseItemForm(category.fields, formData)

    const { error } = await supabase.from(category.table).update(record).eq('id', id)

    if (error) {
        console.error(`Error updating ${category.table}:`, error)
        return { success: false, error: error.message }
    }

    revalidateResumePaths(categoryKey)
    return { success: true }
}

export async function deleteResumeItem(categoryKey: string, id: string) {
    const category = getCategory(categoryKey)
    if (!category) return { success: false, error: 'Unknown category' }
    if (!(await isAuthenticated())) return { success: false, error: 'Unauthorized' }

    const supabase = await createClient()
    const { error } = await supabase.from(category.table).delete().eq('id', id)

    if (error) {
        console.error(`Error deleting ${category.table}:`, error)
        return { success: false, error: error.message }
    }

    revalidateResumePaths(categoryKey)
    return { success: true }
}

// --- 기본 정보 (profile) / 인적 사항 (personal_details) — 싱글턴 폼 ---

export async function getBasicInfoAdmin() {
    if (!(await isAuthenticated())) return { profile: null, personalDetails: null }

    const supabase = await createClient()
    const [{ data: profile }, { data: personalDetails }] = await Promise.all([
        supabase.from('profile').select('*').limit(1).maybeSingle(),
        supabase.from('personal_details').select('*').limit(1).maybeSingle(),
    ])

    return {
        profile: profile as Profile | null,
        personalDetails: personalDetails as PersonalDetails | null,
    }
}

export async function updateBasicInfo(formData: FormData) {
    if (!(await isAuthenticated())) return { success: false, error: 'Unauthorized' }

    const supabase = await createClient()
    const str = (name: string) => ((formData.get(name) as string) || '').trim() || null

    const record = {
        name: str('name') || '',
        role: str('role') || '',
        bio: str('bio') || '',
        one_liner: str('one_liner'),
        email: str('email'),
        blog_url: str('blog_url'),
        avatar_url: str('avatar_url'),
    }

    // profile은 initial_schema에서 seed된 1행을 갱신한다 (없으면 생성)
    const { data: existing } = await supabase.from('profile').select('id').limit(1).maybeSingle()
    const { error } = existing
        ? await supabase.from('profile').update(record).eq('id', existing.id)
        : await supabase.from('profile').insert(record)

    if (error) {
        console.error('Error updating profile:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/archive/basic')
    return { success: true }
}

export async function upsertPersonalDetails(formData: FormData) {
    if (!(await isAuthenticated())) return { success: false, error: 'Unauthorized' }

    const supabase = await createClient()
    const str = (name: string) => ((formData.get(name) as string) || '').trim() || null

    const record = {
        birth_date: str('birth_date'),
        address: str('address'),
        military_service: str('military_service'),
        phone: str('phone'),
    }

    const { data: existing } = await supabase.from('personal_details').select('id').limit(1).maybeSingle()
    const { error } = existing
        ? await supabase.from('personal_details').update(record).eq('id', existing.id)
        : await supabase.from('personal_details').insert(record)

    if (error) {
        console.error('Error upserting personal details:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/archive/basic')
    return { success: true }
}

// 포트폴리오 상세 폼의 프로젝트 선택 옵션용
export async function getProjectOptions() {
    if (!(await isAuthenticated())) return []

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('projects')
        .select('id, title')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching project options:', error)
        return []
    }
    return (data ?? []) as { id: string; title: string }[]
}
