import { render, screen } from '@testing-library/react';
import CareerSections from '@/components/CareerSections';
import type { PublicResumeData } from '@/app/actions/resume';

jest.mock('@/context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en',
        toggleLanguage: jest.fn(),
    }),
}));

const emptyData: PublicResumeData = {
    educations: [],
    experiences: [],
    certifications: [],
    awards: [],
    languageActivities: [],
    educationCourses: [],
};

const meta = {
    is_public: true,
    include_in_resume_default: true,
    display_order: 0,
    tags: [],
};

describe('CareerSections', () => {
    it('공개 항목이 하나도 없으면 아무것도 렌더하지 않는다', () => {
        const { container } = render(<CareerSections data={emptyData} />);
        expect(container.firstChild).toBeNull();
    });

    it('경력/학력 항목을 렌더링한다', () => {
        const data: PublicResumeData = {
            ...emptyData,
            experiences: [{
                ...meta,
                id: 'exp-1',
                company: '테스트 회사',
                position: '백엔드 개발자',
                start_date: '2024.01',
                end_date: null,
                summary: null,
                achievements: ['API 응답 속도 40% 개선'],
            }],
            educations: [{
                ...meta,
                id: 'edu-1',
                school: '한국대학교',
                major: '컴퓨터공학과',
                degree: '학사',
                status: '졸업',
                start_date: '2019.03',
                end_date: '2025.02',
            }],
        };

        render(<CareerSections data={data} />);
        expect(screen.getByText('테스트 회사')).toBeInTheDocument();
        expect(screen.getByText('API 응답 속도 40% 개선')).toBeInTheDocument();
        expect(screen.getByText('한국대학교')).toBeInTheDocument();
        // 재직중(end_date 없음)이면 'career.present' 라벨 사용
        expect(screen.getByText(/career\.present/)).toBeInTheDocument();
    });

    it('빈 하위 카테고리는 헤딩을 렌더하지 않는다', () => {
        const data: PublicResumeData = {
            ...emptyData,
            certifications: [{
                ...meta,
                id: 'cert-1',
                name: '정보처리기사',
                issuer: '한국산업인력공단',
                acquired_date: '2024.06',
                cert_number: null,
            }],
        };

        render(<CareerSections data={data} />);
        expect(screen.getByText('정보처리기사')).toBeInTheDocument();
        expect(screen.queryByText('career.experience')).not.toBeInTheDocument();
        expect(screen.queryByText('career.education')).not.toBeInTheDocument();
    });
});
