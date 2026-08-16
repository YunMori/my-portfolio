'use server'

// 이력서 아카이브 CRUD — 카테고리 레지스트리(utils/resume/config.ts)를 스키마로 삼는
// 제네릭 액션들. 카테고리마다 액션을 따로 두지 않는 대신, 클라이언트가 보낸 카테고리 키는
// 반드시 getCategory()로 화이트리스트 검증한다 (테이블명을 그대로 신뢰하면 안 되므로).
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { isAuthenticated } from '@/utils/auth'
import { getCategory, FieldDef } from '@/utils/resume/config'
import {
    Profile, PersonalDetails, Education, Experience, LanguageActivity,
    Certification, EducationCourse, Award, PortfolioItem, CoverLetter, Project,
} from '@/types/database.types'

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

    // 모든 카테고리가 공유하는 메타 필드
    record.is_public = formData.get('is_public') === 'on' || formData.get('is_public') === 'true'
    record.include_in_resume_default =
        formData.get('include_in_resume_default') === 'on' || formData.get('include_in_resume_default') === 'true'
    record.tags = ((formData.get('tags') as string) || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)

    return record
}

// 이력서 기능은 어드민 전용이라 공개 경로('/')는 재검증하지 않는다.
function revalidateResumePaths(categoryKey: string) {
    revalidatePath(`/admin/archive/${categoryKey}`)
    revalidatePath('/admin/resume')
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

    // 신규 항목은 목록 맨 뒤로
    const { count } = await supabase
        .from(category.table)
        .select('*', { count: 'exact', head: true })
    record.display_order = count ?? 0

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

/**
 * 드래그 정렬 저장: 배열 순서가 곧 display_order.
 *
 * 행마다 UPDATE가 하나씩 나가지만 병렬로 보낸다 — 순차 await면 항목 수만큼 왕복이 직렬로
 * 쌓인다. upsert 한 번으로 합칠 수도 있지만, 부분 컬럼만 보내면 insert 경로의 NOT NULL
 * 제약에 먼저 걸리므로 쓰지 않는다.
 */
export async function reorderResumeItems(categoryKey: string, orderedIds: string[]) {
    const category = getCategory(categoryKey)
    if (!category) return { success: false, error: 'Unknown category' }
    if (!(await isAuthenticated())) return { success: false, error: 'Unauthorized' }

    const supabase = await createClient()

    const results = await Promise.all(
        orderedIds.map((id, i) =>
            supabase.from(category.table).update({ display_order: i }).eq('id', id)
        )
    )

    const failed = results.find(r => r.error)
    if (failed?.error) {
        console.error(`Error reordering ${category.table}:`, failed.error)
        return { success: false, error: failed.error.message }
    }

    revalidateResumePaths(categoryKey)
    return { success: true }
}

// 토글(공개 여부 / 이력서 기본 포함)만 빠르게 갱신
export async function toggleResumeItemFlag(
    categoryKey: string,
    id: string,
    flag: 'is_public' | 'include_in_resume_default',
    value: boolean,
) {
    const category = getCategory(categoryKey)
    if (!category) return { success: false, error: 'Unknown category' }
    if (!(await isAuthenticated())) return { success: false, error: 'Unauthorized' }

    const supabase = await createClient()
    const { error } = await supabase.from(category.table).update({ [flag]: value }).eq('id', id)

    if (error) {
        console.error(`Error toggling ${category.table}.${flag}:`, error)
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
    revalidatePath('/admin/resume')
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
        // 민감 필드는 빌더에서 기본 꺼짐이 안전하므로 명시적으로 켜야만 켜진다
        include_in_resume_default: formData.get('include_in_resume_default') === 'on',
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
    revalidatePath('/admin/resume')
    return { success: true }
}

// --- 이력서 빌더용 데이터 — 인증 전용, 비공개 행 + 민감정보 포함 ---

export type ResumeBuilderData = {
    profile: Profile | null;
    personalDetails: PersonalDetails | null;
    projects: Project[];
    educations: Education[];
    experiences: Experience[];
    languageActivities: LanguageActivity[];
    certifications: Certification[];
    educationCourses: EducationCourse[];
    awards: Award[];
    portfolioItems: PortfolioItem[];
    coverLetters: CoverLetter[];
}

export async function getResumeBuilderData(): Promise<ResumeBuilderData | null> {
    if (!(await isAuthenticated())) return null

    const supabase = await createClient()

    const fetchAll = async <T,>(table: string): Promise<T[]> => {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false })
        if (error) {
            console.error(`Error fetching ${table} (builder):`, error)
            return []
        }
        return data as T[]
    }

    const [
        { data: profile }, { data: personalDetails },
        projects, educations, experiences, languageActivities,
        certifications, educationCourses, awards, portfolioItems, coverLetters,
    ] = await Promise.all([
        supabase.from('profile').select('*').limit(1).maybeSingle(),
        supabase.from('personal_details').select('*').limit(1).maybeSingle(),
        fetchAll<Project>('projects'),
        fetchAll<Education>('educations'),
        fetchAll<Experience>('experiences'),
        fetchAll<LanguageActivity>('language_activities'),
        fetchAll<Certification>('certifications'),
        fetchAll<EducationCourse>('education_courses'),
        fetchAll<Award>('awards'),
        fetchAll<PortfolioItem>('portfolio_items'),
        fetchAll<CoverLetter>('cover_letters'),
    ])

    return {
        profile: profile as Profile | null,
        personalDetails: personalDetails as PersonalDetails | null,
        projects, educations, experiences, languageActivities,
        certifications, educationCourses, awards, portfolioItems, coverLetters,
    }
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
