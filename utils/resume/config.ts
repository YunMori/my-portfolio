// 이력서 아카이브 카테고리 레지스트리
// - 제네릭 관리자 매니저(ResumeItemManager)와 제네릭 서버 액션(app/actions/resume.ts)이 공유
// - 서버 액션은 반드시 이 레지스트리로 테이블명을 화이트리스트 검증 (클라이언트발 테이블명 직접 사용 금지)

export type FieldType =
    | 'text'      // 한 줄 텍스트
    | 'textarea'  // 여러 줄 텍스트
    | 'month'     // 'YYYY.MM' 텍스트 (기존 projects.date 컨벤션)
    | 'date'      // 'YYYY-MM-DD' (date 컬럼)
    | 'select'    // options 중 택1
    | 'bullets'   // 줄바꿈 구분 → text[] (예: 경력 성과)
    | 'number'    // 정수
    | 'project';  // projects 테이블 참조 (uuid select)

export type FieldDef = {
    name: string;             // DB 컬럼명
    label: string;            // 폼 라벨 (한국어)
    type: FieldType;
    required?: boolean;
    placeholder?: string;
    options?: { value: string; label: string }[]; // type = 'select'
};

export type CategoryKey =
    | 'educations'
    | 'experiences'
    | 'language_activities'
    | 'certifications'
    | 'education_courses'
    | 'awards'
    | 'portfolio_items'
    | 'cover_letters';

export type ResumeCategory = {
    key: CategoryKey;
    table: CategoryKey;       // 테이블명 = key (화이트리스트 검증용)
    labelKo: string;
    labelEn: string;
    icon: string;             // Font Awesome 클래스
    titleField: string;       // 리스트 행 제목으로 쓸 컬럼
    subtitleFields: string[]; // 리스트 행 부제로 쓸 컬럼들
    sensitive?: boolean;      // 비공개 데이터 안내 표시
    fields: FieldDef[];
};

export const RESUME_CATEGORIES: ResumeCategory[] = [
    {
        key: 'educations',
        table: 'educations',
        labelKo: '학력 사항',
        labelEn: 'Education',
        icon: 'fa-graduation-cap',
        titleField: 'school',
        subtitleFields: ['major', 'status'],
        fields: [
            { name: 'school', label: '학교명', type: 'text', required: true, placeholder: '한국대학교' },
            { name: 'major', label: '전공', type: 'text', placeholder: '컴퓨터공학과' },
            { name: 'degree', label: '학위', type: 'text', placeholder: '학사' },
            {
                name: 'status', label: '상태', type: 'select', options: [
                    { value: '재학', label: '재학' },
                    { value: '휴학', label: '휴학' },
                    { value: '졸업예정', label: '졸업예정' },
                    { value: '졸업', label: '졸업' },
                    { value: '중퇴', label: '중퇴' },
                ]
            },
            { name: 'start_date', label: '입학', type: 'month', placeholder: '2019.03' },
            { name: 'end_date', label: '졸업', type: 'month', placeholder: '2025.02' },
        ],
    },
    {
        key: 'experiences',
        table: 'experiences',
        labelKo: '경력 사항',
        labelEn: 'Experience',
        icon: 'fa-briefcase',
        titleField: 'company',
        subtitleFields: ['position', 'start_date'],
        fields: [
            { name: 'company', label: '회사명', type: 'text', required: true },
            { name: 'position', label: '직무/직책', type: 'text', placeholder: '백엔드 개발자' },
            { name: 'start_date', label: '입사', type: 'month', placeholder: '2024.01' },
            { name: 'end_date', label: '퇴사 (재직중이면 비움)', type: 'month', placeholder: '2025.06' },
            { name: 'summary', label: '요약', type: 'textarea' },
            { name: 'achievements', label: '주요 업무 및 성과 (줄바꿈으로 구분)', type: 'bullets', placeholder: 'API 응답 속도 40% 개선\n결제 모듈 신규 개발' },
        ],
    },
    {
        key: 'language_activities',
        table: 'language_activities',
        labelKo: '어학/활동',
        labelEn: 'Language / Activities',
        icon: 'fa-earth-asia',
        titleField: 'name',
        subtitleFields: ['score_or_desc', 'activity_date'],
        fields: [
            {
                name: 'activity_type', label: '유형', type: 'select', options: [
                    { value: 'language', label: '어학점수' },
                    { value: 'club', label: '동아리' },
                    { value: 'external', label: '대외활동' },
                ]
            },
            { name: 'name', label: '이름', type: 'text', required: true, placeholder: 'TOEIC / ○○ 동아리' },
            { name: 'score_or_desc', label: '점수 또는 설명', type: 'text', placeholder: '900점' },
            { name: 'activity_date', label: '날짜', type: 'month', placeholder: '2024.11' },
        ],
    },
    {
        key: 'certifications',
        table: 'certifications',
        labelKo: '자격증',
        labelEn: 'Certifications',
        icon: 'fa-certificate',
        titleField: 'name',
        subtitleFields: ['issuer', 'acquired_date'],
        fields: [
            { name: 'name', label: '자격증명', type: 'text', required: true, placeholder: '정보처리기사' },
            { name: 'issuer', label: '발급기관', type: 'text', placeholder: '한국산업인력공단' },
            { name: 'acquired_date', label: '취득일', type: 'month', placeholder: '2024.06' },
            { name: 'cert_number', label: '자격증 번호 (선택)', type: 'text' },
        ],
    },
    {
        key: 'education_courses',
        table: 'education_courses',
        labelKo: '교육 이수',
        labelEn: 'Courses',
        icon: 'fa-chalkboard-user',
        titleField: 'course_name',
        subtitleFields: ['institution', 'start_date'],
        fields: [
            { name: 'course_name', label: '과정명', type: 'text', required: true, placeholder: 'SSAFY 12기' },
            { name: 'institution', label: '기관', type: 'text', placeholder: '삼성 청년 SW 아카데미' },
            { name: 'start_date', label: '시작', type: 'month', placeholder: '2024.07' },
            { name: 'end_date', label: '종료', type: 'month', placeholder: '2025.06' },
            { name: 'summary', label: '이수 내용 요약', type: 'textarea' },
        ],
    },
    {
        key: 'awards',
        table: 'awards',
        labelKo: '수상 경력',
        labelEn: 'Awards',
        icon: 'fa-trophy',
        titleField: 'name',
        subtitleFields: ['rank', 'awarded_date'],
        fields: [
            { name: 'name', label: '대회/수상명', type: 'text', required: true },
            { name: 'awarded_date', label: '날짜', type: 'month', placeholder: '2025.03' },
            { name: 'rank', label: '순위/등급', type: 'text', placeholder: '대상' },
            { name: 'description', label: '설명', type: 'textarea' },
        ],
    },
    {
        key: 'portfolio_items',
        table: 'portfolio_items',
        labelKo: '포트폴리오 상세',
        labelEn: 'Portfolio Items',
        icon: 'fa-images',
        titleField: 'title',
        subtitleFields: ['item_type'],
        fields: [
            { name: 'project_id', label: '연결 프로젝트', type: 'project', required: true },
            {
                name: 'item_type', label: '유형', type: 'select', options: [
                    { value: 'image', label: '디자인 이미지' },
                    { value: 'code', label: '코드 스니펫' },
                    { value: 'video', label: '데모 영상' },
                ]
            },
            { name: 'title', label: '제목', type: 'text' },
            { name: 'description', label: '설명', type: 'textarea' },
            { name: 'image_url', label: '이미지 URL', type: 'text' },
            { name: 'code_snippet', label: '코드 스니펫', type: 'textarea' },
            { name: 'code_language', label: '코드 언어', type: 'text', placeholder: 'typescript' },
            { name: 'video_url', label: '영상 링크', type: 'text' },
        ],
    },
    {
        key: 'cover_letters',
        table: 'cover_letters',
        labelKo: '자기소개서',
        labelEn: 'Cover Letters',
        icon: 'fa-file-pen',
        titleField: 'title',
        subtitleFields: ['question'],
        sensitive: true,
        fields: [
            { name: 'title', label: '지원 회사/용도', type: 'text', required: true, placeholder: '○○기업 상반기 공채' },
            { name: 'question', label: '문항', type: 'textarea' },
            { name: 'answer', label: '답변', type: 'textarea' },
            { name: 'char_limit', label: '글자수 제한 (없으면 비움)', type: 'number', placeholder: '1000' },
        ],
    },
];

export const CATEGORY_MAP: Record<string, ResumeCategory> =
    Object.fromEntries(RESUME_CATEGORIES.map(c => [c.key, c]));

// 서버 액션 화이트리스트 검증 헬퍼
export function getCategory(key: string): ResumeCategory | null {
    return CATEGORY_MAP[key] ?? null;
}
