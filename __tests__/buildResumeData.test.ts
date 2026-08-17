import {
    buildResumeData, defaultSelections, sanitizeSelections,
} from '@/utils/resume/buildResumeData'
import type { ResumeBuilderData } from '@/app/actions/resume'
import { Education, Experience, PersonalDetails, Profile, Project, ProjectContribution } from '@/types/database.types'

const meta = {
    is_public: true,
    include_in_resume_default: true,
    display_order: 0,
    tags: [],
}

const profile: Profile = {
    id: 'profile-1',
    name: '홍길동',
    role: 'Backend Developer',
    bio: '',
    avatar_url: 'https://example.com/photo.jpg',
    resume_url: null,
    social_links: { github: 'https://github.com/hong' },
    one_liner: '문제를 구조로 푸는 개발자',
    email: 'hong@example.com',
    blog_url: null,
}

const personalDetails: PersonalDetails = {
    ...meta,
    id: 'pd-1',
    birth_date: '1999-01-01',
    address: '서울시',
    military_service: '육군 만기전역',
    phone: '010-1234-5678',
    include_in_resume_default: false, // 민감정보 기본 OFF
}

const educations: Education[] = [
    { ...meta, id: 'edu-1', school: 'A대학교', major: 'CS', degree: '학사', status: '졸업', start_date: '2019.03', end_date: '2025.02' },
    { ...meta, id: 'edu-2', school: 'B고등학교', major: null, degree: null, status: '졸업', start_date: null, end_date: null, include_in_resume_default: false },
]

const experiences: Experience[] = [
    { ...meta, id: 'exp-1', company: '테스트회사', position: '개발자', start_date: '2024.01', end_date: null, summary: null, achievements: ['성과 1'] },
]

const baseData: ResumeBuilderData = {
    profile,
    personalDetails,
    projects: [],
    educations,
    experiences,
    languageActivities: [],
    certifications: [],
    educationCourses: [],
    awards: [],
    contributions: [],
    coverLetters: [],
}

describe('defaultSelections', () => {
    it('include_in_resume_default=true 항목만 초기 선택된다', () => {
        const selections = defaultSelections(baseData)
        expect(selections.items.educations).toEqual(['edu-1']) // edu-2는 기본 제외
        expect(selections.items.experiences).toEqual(['exp-1'])
    })

    it('민감 기본정보 필드(전화/생년월일/주소/병역)는 기본 OFF', () => {
        const selections = defaultSelections(baseData)
        expect(selections.basicFields.phone).toBe(false)
        expect(selections.basicFields.birth_date).toBe(false)
        expect(selections.basicFields.address).toBe(false)
        expect(selections.basicFields.military_service).toBe(false)
        // 비민감 필드는 값이 있으면 기본 ON
        expect(selections.basicFields.email).toBe(true)
        expect(selections.basicFields.github).toBe(true)
        expect(selections.basicFields.photo).toBe(true)
        expect(selections.basicFields.blog).toBe(false) // 값 없음
    })
})

describe('buildResumeData', () => {
    it('선택된 항목만 결과에 포함한다', () => {
        const selections = defaultSelections(baseData)
        const result = buildResumeData(baseData, selections)
        expect(result.educations.map(e => e.id)).toEqual(['edu-1'])
        expect(result.experiences).toHaveLength(1)
        expect(result.name).toBe('홍길동')
    })

    it('토글 OFF된 민감 필드는 null이 된다', () => {
        const selections = defaultSelections(baseData)
        const result = buildResumeData(baseData, selections)
        expect(result.contacts.phone).toBeNull()
        expect(result.personal.birthDate).toBeNull()
        expect(result.personal.address).toBeNull()
        expect(result.personal.militaryService).toBeNull()
        expect(result.contacts.email).toBe('hong@example.com')
    })

    it('민감 필드를 켜면 값이 노출된다', () => {
        const selections = defaultSelections(baseData)
        selections.basicFields.phone = true
        const result = buildResumeData(baseData, selections)
        expect(result.contacts.phone).toBe('010-1234-5678')
    })

    it('토글 해제 시 항목이 제외된다', () => {
        const selections = defaultSelections(baseData)
        selections.items.educations = []
        const result = buildResumeData(baseData, selections)
        expect(result.educations).toHaveLength(0)
    })
})

describe('sanitizeSelections (프리셋 로드)', () => {
    it('삭제된 항목 id는 조용히 걸러낸다', () => {
        const stored = {
            items: {
                ...defaultSelections(baseData).items,
                educations: ['edu-1', 'deleted-id'],
            },
            basicFields: defaultSelections(baseData).basicFields,
        }
        const result = sanitizeSelections(stored, baseData)
        expect(result.items.educations).toEqual(['edu-1'])
    })

    it('null/미지정이면 기본 선택 상태를 반환한다', () => {
        const result = sanitizeSelections(null, baseData)
        expect(result).toEqual(defaultSelections(baseData))
    })

    it('저장된 basicFields 토글을 복원한다', () => {
        const stored = {
            basicFields: { ...defaultSelections(baseData).basicFields, phone: true },
        }
        const result = sanitizeSelections(stored, baseData)
        expect(result.basicFields.phone).toBe(true)
    })
})

describe('프로젝트 기여 (project_contributions)', () => {
    const projects: Project[] = [
        { ...meta, id: 'proj-1', slug: 'alpha', title: 'Alpha', title_en: null, description: '', description_en: null, stack: [], date: '2026.01' },
        { ...meta, id: 'proj-2', slug: 'beta', title: 'Beta', title_en: null, description: '', description_en: null, stack: [], date: '2026.02' },
    ]

    const contributions: ProjectContribution[] = [
        { ...meta, id: 'c-1', project_id: 'proj-1', title: '기여 1', area: 'feature', problem: null, actions: ['한 일'], outcome: [], metric: null },
        { ...meta, id: 'c-2', project_id: 'proj-2', title: '기여 2', area: 'performance', problem: null, actions: [], outcome: ['결과'], metric: '3.2s → 0.4s' },
    ]

    const data: ResumeBuilderData = { ...baseData, projects, contributions }

    it('선택된 프로젝트의 기여만 남는다', () => {
        const selections = defaultSelections(data)
        selections.items.projects = ['proj-1'] // proj-2를 끈다
        const result = buildResumeData(data, selections)

        expect(result.projects.map(p => p.id)).toEqual(['proj-1'])
        // c-2는 개별 토글은 켜져 있지만 부모 프로젝트가 빠졌으므로 함께 사라진다
        expect(result.contributions.map(c => c.id)).toEqual(['c-1'])
    })

    it('기여를 개별로 끄면 그것만 빠진다', () => {
        const selections = defaultSelections(data)
        selections.items.project_contributions = ['c-2']
        const result = buildResumeData(data, selections)

        expect(result.projects).toHaveLength(2)
        expect(result.contributions.map(c => c.id)).toEqual(['c-2'])
    })

    it('프로젝트를 전부 끄면 기여도 전부 사라진다', () => {
        const selections = defaultSelections(data)
        selections.items.projects = []
        const result = buildResumeData(data, selections)

        expect(result.contributions).toEqual([])
    })
})
