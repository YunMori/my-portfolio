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
    | 'project_contributions'
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
    /*
     * 프로젝트 기여 — 여기 입력한 내용이 세 곳에서 쓰인다:
     *   1) 공개 상세 페이지 /projects/[slug] (is_public 인 행만)
     *   2) 이력서 PDF 프로젝트 섹션 (선택된 프로젝트 아래에 중첩)
     *   3) 이력서 빌더 토글 목록
     * problem → actions → outcome 순서가 그대로 읽히는 순서다.
     */
    {
        key: 'project_contributions',
        table: 'project_contributions',
        labelKo: '프로젝트 기여',
        labelEn: 'Contributions',
        icon: 'fa-screwdriver-wrench',
        titleField: 'title',
        subtitleFields: ['area', 'metric'],
        fields: [
            { name: 'project_id', label: '연결 프로젝트', type: 'project', required: true },
            { name: 'title', label: '무엇을 했는가', type: 'text', required: true, placeholder: 'PDF 미리보기 렌더 파이프라인 구축' },
            {
                name: 'area', label: '구분', type: 'select', options: [
                    { value: 'feature', label: '기능 개발' },
                    { value: 'performance', label: '성능 개선' },
                    { value: 'infra', label: '인프라·배포' },
                    { value: 'data', label: '데이터·모델' },
                    { value: 'process', label: '협업·프로세스' },
                    { value: 'etc', label: '기타' },
                ]
            },
            { name: 'metric', label: '대표 지표', type: 'text', placeholder: '첫 렌더 3.2s → 0.4s' },
            { name: 'problem', label: '문제 상황', type: 'textarea', placeholder: '무엇이 문제였는지 한두 문장으로' },
            { name: 'actions', label: '한 일 (한 줄에 하나)', type: 'bullets', placeholder: 'CSP에 wasm-unsafe-eval 추가\n렌더 큐 디바운스 적용' },
            { name: 'outcome', label: '결과 (한 줄에 하나)', type: 'bullets', placeholder: '미리보기 실패율 100% → 0%' },
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
