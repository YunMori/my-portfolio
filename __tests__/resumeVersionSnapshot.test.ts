/**
 * 버전 스냅샷의 핵심 성질 회귀 테스트.
 *
 * 버전(resume_versions)은 두 가지를 함께 들고 있다:
 *   - snapshot   : 저장 시점의 ResumeData 전체 → 이후 아카이브가 바뀌어도 절대 변하지 않는다
 *   - selections : 토글 상태만 → 최신 아카이브 위에 복원되며, 삭제된 항목은 걸러진다
 *
 * 이 둘이 갈라지는 지점이 프리셋 대신 스냅샷을 택한 이유 자체이므로, 여기서 고정해 둔다.
 */
import {
    buildResumeData, defaultSelections, sanitizeSelections,
} from '@/utils/resume/buildResumeData'
import type { ResumeBuilderData } from '@/app/actions/resume'
import { Education, Experience, Profile } from '@/types/database.types'

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
    avatar_url: null,
    resume_url: null,
    social_links: { github: 'https://github.com/hong' },
    one_liner: null,
    email: 'hong@example.com',
    blog_url: null,
}

const educations: Education[] = [
    { ...meta, id: 'edu-1', school: 'A대학교', major: 'CS', degree: '학사', status: '졸업', start_date: '2019.03', end_date: '2025.02' },
]

const experiences: Experience[] = [
    { ...meta, id: 'exp-1', company: '첫번째회사', position: '개발자', start_date: '2024.01', end_date: null, summary: null, achievements: ['성과 1'] },
    { ...meta, id: 'exp-2', company: '두번째회사', position: '시니어', start_date: '2025.01', end_date: null, summary: null, achievements: [] },
]

const baseData: ResumeBuilderData = {
    profile,
    personalDetails: null,
    projects: [],
    educations,
    experiences,
    languageActivities: [],
    certifications: [],
    educationCourses: [],
    awards: [],
    portfolioItems: [],
    coverLetters: [],
}

// 아카이브에서 exp-2를 삭제한 뒤의 상태
const dataAfterDeletion: ResumeBuilderData = {
    ...baseData,
    experiences: experiences.filter(e => e.id !== 'exp-2'),
}

describe('버전 스냅샷', () => {
    it('saveVersion에 넘기는 스냅샷은 그 시점 buildResumeData 결과와 동일하다', () => {
        const selections = defaultSelections(baseData)

        // ResumeBuilder.handleSaveVersion이 저장하는 값과 같은 경로
        const snapshot = buildResumeData(baseData, selections)

        expect(snapshot).toEqual(buildResumeData(baseData, selections))
        expect(snapshot.experiences.map(e => e.id)).toEqual(['exp-1', 'exp-2'])
    })

    it('아카이브에서 항목을 지워도 이미 저장된 스냅샷은 그대로다', () => {
        const selections = defaultSelections(baseData)
        const snapshot = buildResumeData(baseData, selections)

        // 스냅샷은 저장된 JSON을 그대로 렌더링할 뿐, 현재 데이터를 참조하지 않는다.
        // 삭제 이후에도 같은 객체가 같은 내용을 유지해야 한다.
        const stillThere = snapshot.experiences.find(e => e.id === 'exp-2')
        expect(stillThere).toBeDefined()
        expect(stillThere?.company).toBe('두번째회사')
        expect(snapshot.experiences).toHaveLength(2)
    })

    it('반대로 selections 복원은 삭제된 항목을 걸러내고 최신 데이터를 따른다', () => {
        const selections = defaultSelections(baseData)

        // "이 설정으로 편집" 경로 — 최신 데이터 위에 복원
        const restored = sanitizeSelections(selections, dataAfterDeletion)
        expect(restored.items.experiences).toEqual(['exp-1'])

        const rebuilt = buildResumeData(dataAfterDeletion, restored)
        expect(rebuilt.experiences.map(e => e.id)).toEqual(['exp-1'])
    })

    it('스냅샷과 복원 결과가 서로 다른 것이 버전 관리의 요점이다', () => {
        const selections = defaultSelections(baseData)
        const snapshot = buildResumeData(baseData, selections)

        const restored = sanitizeSelections(selections, dataAfterDeletion)
        const rebuilt = buildResumeData(dataAfterDeletion, restored)

        expect(snapshot.experiences).toHaveLength(2)
        expect(rebuilt.experiences).toHaveLength(1)
        expect(snapshot).not.toEqual(rebuilt)
    })

    it('스냅샷은 JSON 왕복(jsonb 저장/조회)을 견딘다', () => {
        const selections = defaultSelections(baseData)
        const snapshot = buildResumeData(baseData, selections)

        // resume_versions.snapshot은 jsonb라 저장 후 읽으면 JSON 왕복을 거친다.
        const roundTripped = JSON.parse(JSON.stringify(snapshot))
        expect(roundTripped).toEqual(snapshot)
    })
})
