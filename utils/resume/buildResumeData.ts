// 이력서 빌더의 토글 선택 상태 → 고정 템플릿이 소비하는 ResumeData 변환 (순수 함수)
// react-pdf에 의존하지 않으므로 Jest에서 단독 테스트 가능

import {
    Profile, PersonalDetails, Project, Education, Experience, LanguageActivity,
    Certification, EducationCourse, Award, PortfolioItem, CoverLetter,
} from '@/types/database.types'
import type { ResumeBuilderData } from '@/app/actions/resume'

// 기본 정보 필드 단위 토글 키
export type BasicFieldKey =
    | 'photo' | 'email' | 'github' | 'blog'
    | 'phone' | 'birth_date' | 'address' | 'military_service'

// 항목 토글이 있는 카테고리 키 (프로젝트 포함)
export const TOGGLE_CATEGORIES = [
    'projects', 'educations', 'experiences', 'language_activities',
    'certifications', 'education_courses', 'awards', 'portfolio_items', 'cover_letters',
] as const
export type ToggleCategoryKey = typeof TOGGLE_CATEGORIES[number]

export type ResumeSelections = {
    // 카테고리별 선택된 항목 id 집합
    items: Record<ToggleCategoryKey, string[]>
    // 기본 정보 필드 단위 토글
    basicFields: Record<BasicFieldKey, boolean>
}

// 고정 템플릿이 소비하는 최종 데이터 구조
export type ResumeData = {
    name: string
    role: string
    oneLiner: string | null
    photoUrl: string | null
    contacts: {
        email: string | null
        phone: string | null
        github: string | null
        blog: string | null
    }
    personal: {
        birthDate: string | null
        address: string | null
        militaryService: string | null
    }
    educations: Education[]
    experiences: Experience[]
    projects: Project[]
    certifications: Certification[]
    languageActivities: LanguageActivity[]
    educationCourses: EducationCourse[]
    awards: Award[]
    portfolioItems: PortfolioItem[]
    coverLetters: CoverLetter[]
}

// 초기 토글 상태: 각 항목의 include_in_resume_default 값으로 세팅
export function defaultSelections(data: ResumeBuilderData): ResumeSelections {
    const pick = (items: { id: string; include_in_resume_default?: boolean }[]) =>
        items.filter(i => i.include_in_resume_default !== false).map(i => i.id)

    const profile: Profile | null = data.profile
    const details: PersonalDetails | null = data.personalDetails
    // 민감 필드(전화/생년월일/주소/병역)는 personal_details.include_in_resume_default 값(기본 false)을 따름
    const sensitiveOn = details?.include_in_resume_default === true

    return {
        items: {
            projects: pick(data.projects),
            educations: pick(data.educations),
            experiences: pick(data.experiences),
            language_activities: pick(data.languageActivities),
            certifications: pick(data.certifications),
            education_courses: pick(data.educationCourses),
            awards: pick(data.awards),
            portfolio_items: pick(data.portfolioItems),
            cover_letters: pick(data.coverLetters),
        },
        basicFields: {
            photo: !!profile?.avatar_url,
            email: !!profile?.email,
            github: !!profile?.social_links?.github,
            blog: !!profile?.blog_url,
            phone: sensitiveOn && !!details?.phone,
            birth_date: sensitiveOn && !!details?.birth_date,
            address: sensitiveOn && !!details?.address,
            military_service: sensitiveOn && !!details?.military_service,
        },
    }
}

// 선택된 항목만 남긴다 (display_order 정렬은 서버 조회 순서를 신뢰)
function filterSelected<T extends { id: string }>(items: T[], selectedIds: string[]): T[] {
    const selected = new Set(selectedIds)
    return items.filter(i => selected.has(i.id))
}

export function buildResumeData(data: ResumeBuilderData, selections: ResumeSelections): ResumeData {
    const profile = data.profile
    const details = data.personalDetails
    const on = selections.basicFields

    return {
        name: profile?.name ?? '',
        role: profile?.role ?? '',
        oneLiner: profile?.one_liner ?? null,
        photoUrl: on.photo ? (profile?.avatar_url ?? null) : null,
        contacts: {
            email: on.email ? (profile?.email ?? null) : null,
            phone: on.phone ? (details?.phone ?? null) : null,
            github: on.github ? (profile?.social_links?.github ?? null) : null,
            blog: on.blog ? (profile?.blog_url ?? null) : null,
        },
        personal: {
            birthDate: on.birth_date ? (details?.birth_date ?? null) : null,
            address: on.address ? (details?.address ?? null) : null,
            militaryService: on.military_service ? (details?.military_service ?? null) : null,
        },
        educations: filterSelected(data.educations, selections.items.educations),
        experiences: filterSelected(data.experiences, selections.items.experiences),
        projects: filterSelected(data.projects, selections.items.projects),
        certifications: filterSelected(data.certifications, selections.items.certifications),
        languageActivities: filterSelected(data.languageActivities, selections.items.language_activities),
        educationCourses: filterSelected(data.educationCourses, selections.items.education_courses),
        awards: filterSelected(data.awards, selections.items.awards),
        portfolioItems: filterSelected(data.portfolioItems, selections.items.portfolio_items),
        coverLetters: filterSelected(data.coverLetters, selections.items.cover_letters),
    }
}

// 프리셋 로드: 저장된 selections에서 이미 삭제된 항목 id를 조용히 걸러낸다
export function sanitizeSelections(
    raw: Partial<ResumeSelections> | null | undefined,
    data: ResumeBuilderData,
): ResumeSelections {
    const base = defaultSelections(data)
    if (!raw) return base

    const validIds: Record<ToggleCategoryKey, Set<string>> = {
        projects: new Set(data.projects.map(i => i.id)),
        educations: new Set(data.educations.map(i => i.id)),
        experiences: new Set(data.experiences.map(i => i.id)),
        language_activities: new Set(data.languageActivities.map(i => i.id)),
        certifications: new Set(data.certifications.map(i => i.id)),
        education_courses: new Set(data.educationCourses.map(i => i.id)),
        awards: new Set(data.awards.map(i => i.id)),
        portfolio_items: new Set(data.portfolioItems.map(i => i.id)),
        cover_letters: new Set(data.coverLetters.map(i => i.id)),
    }

    const items = { ...base.items }
    for (const key of TOGGLE_CATEGORIES) {
        const stored = raw.items?.[key]
        if (Array.isArray(stored)) {
            items[key] = stored.filter(id => validIds[key].has(id))
        }
    }

    return {
        items,
        basicFields: { ...base.basicFields, ...(raw.basicFields ?? {}) },
    }
}
