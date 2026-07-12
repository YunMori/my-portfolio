import { RESUME_CATEGORIES, CATEGORY_MAP, getCategory } from '@/utils/resume/config'

describe('resume category registry', () => {
    it('모든 카테고리가 필수 속성을 갖는다', () => {
        for (const category of RESUME_CATEGORIES) {
            expect(category.key).toBeTruthy()
            expect(category.table).toBe(category.key) // 테이블명 = key (화이트리스트)
            expect(category.labelKo).toBeTruthy()
            expect(category.labelEn).toBeTruthy()
            expect(category.icon).toMatch(/^fa-/)
            expect(category.fields.length).toBeGreaterThan(0)
            // 리스트 행 제목 필드는 실제 필드 정의에 존재해야 함
            expect(category.fields.some(f => f.name === category.titleField)).toBe(true)
        }
    })

    it('카테고리 키가 중복되지 않는다', () => {
        const keys = RESUME_CATEGORIES.map(c => c.key)
        expect(new Set(keys).size).toBe(keys.length)
    })

    it('select 필드는 options를 갖는다', () => {
        for (const category of RESUME_CATEGORIES) {
            for (const field of category.fields) {
                if (field.type === 'select') {
                    expect(field.options && field.options.length).toBeGreaterThan(0)
                }
            }
        }
    })

    it('getCategory는 화이트리스트 검증에 쓸 수 있다', () => {
        expect(getCategory('educations')?.table).toBe('educations')
        // 임의 테이블명 주입 시도는 null 반환
        expect(getCategory('daily_stats')).toBeNull()
        expect(getCategory('profile; DROP TABLE projects')).toBeNull()
        expect(getCategory('')).toBeNull()
    })

    it('요구된 8개 카테고리가 모두 등록되어 있다', () => {
        const expected = [
            'educations', 'experiences', 'language_activities', 'certifications',
            'education_courses', 'awards', 'portfolio_items', 'cover_letters',
        ]
        expected.forEach(key => expect(CATEGORY_MAP[key]).toBeDefined())
        expect(RESUME_CATEGORIES).toHaveLength(expected.length)
    })
})
