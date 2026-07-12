export type Profile = {
    id: string;
    name: string;
    role: string;
    bio: string;
    avatar_url: string | null;
    resume_url: string | null;
    social_links: {
        github?: string;
        linkedin?: string;
        email?: string;
    } | null;
    // 이력서 기본 정보 확장 (resume_platform_migration.sql)
    one_liner?: string | null;
    email?: string | null;
    blog_url?: string | null;
    user_id?: string | null;
    created_at?: string;
    updated_at?: string;
}

// 이력서 아카이브 공통 메타 필드
export type ResumeMeta = {
    id: string;
    user_id?: string | null;
    is_public: boolean;
    include_in_resume_default: boolean;
    display_order: number;
    tags: string[] | null;
    created_at?: string;
    updated_at?: string;
}

export type Project = {
    id: string;
    title: string;
    description: string;
    stack: string[];
    date: string;
    image_url?: string;
    link?: string;
    github_link?: string;
    content?: string;
    created_at?: string;
    // 이력서 확장 필드 (resume_platform_migration.sql)
    role?: string | null;
    period_start?: string | null;
    period_end?: string | null;
    user_id?: string | null;
    is_public?: boolean;
    include_in_resume_default?: boolean;
    display_order?: number;
    tags?: string[] | null;
    updated_at?: string;
}

export type Post = {
    id: string;
    title: string;
    slug: string;
    description: string;
    content: string;
    tags: string[];
    published: boolean;
    date: string;
    created_at?: string;
}

// --- 이력서 아카이브 카테고리 타입 ---

// 인적 사항 (민감정보 — 공개 조회 불가)
export type PersonalDetails = ResumeMeta & {
    birth_date: string | null;
    address: string | null;
    military_service: string | null;
    phone: string | null;
}

// 학력 사항
export type Education = ResumeMeta & {
    school: string;
    major: string | null;
    degree: string | null;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
}

// 경력 사항
export type Experience = ResumeMeta & {
    company: string;
    position: string | null;
    start_date: string | null;
    end_date: string | null;
    summary: string | null;
    achievements: string[] | null;
}

// 어학/자격/활동
export type LanguageActivity = ResumeMeta & {
    activity_type: 'language' | 'club' | 'external' | null;
    name: string;
    score_or_desc: string | null;
    activity_date: string | null;
}

// 자격증
export type Certification = ResumeMeta & {
    name: string;
    issuer: string | null;
    acquired_date: string | null;
    cert_number: string | null;
}

// 교육 이수 사항
export type EducationCourse = ResumeMeta & {
    course_name: string;
    institution: string | null;
    start_date: string | null;
    end_date: string | null;
    summary: string | null;
}

// 수상 경력
export type Award = ResumeMeta & {
    name: string;
    awarded_date: string | null;
    rank: string | null;
    description: string | null;
}

// 포트폴리오 상세 (프로젝트 1:N)
export type PortfolioItem = ResumeMeta & {
    project_id: string;
    item_type: 'image' | 'code' | 'video' | null;
    title: string | null;
    description: string | null;
    image_url: string | null;
    code_snippet: string | null;
    code_language: string | null;
    video_url: string | null;
}

// 자기소개서 (민감정보 — 공개 조회 불가)
export type CoverLetter = ResumeMeta & {
    title: string;
    question: string | null;
    answer: string | null;
    char_limit: number | null;
}

// 이력서 프리셋 선택 상태: 카테고리 키 → 선택된 항목 id 목록 + 기본정보 필드 토글
export type PresetSelections = {
    [category: string]: string[] | { [field: string]: boolean };
}

// 이력서 프리셋
export type ResumePreset = {
    id: string;
    name: string;
    selections: PresetSelections;
    user_id?: string | null;
    created_at?: string;
    updated_at?: string;
}

export type Database = {
    public: {
        Tables: {
            profile: {
                Row: Profile;
                Insert: Omit<Profile, 'id' | 'created_at'>;
                Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
            };
            projects: {
                Row: Project;
                Insert: Omit<Project, 'id' | 'created_at'>;
                Update: Partial<Omit<Project, 'id' | 'created_at'>>;
            };
            posts: {
                Row: Post;
                Insert: Omit<Post, 'id' | 'created_at'>;
                Update: Partial<Omit<Post, 'id' | 'created_at'>>;
            };
            daily_stats: {
                Row: {
                    date: string;
                    views: number;
                    created_at: string;
                };
                Insert: {
                    date?: string;
                    views?: number;
                    created_at?: string;
                };
                Update: {
                    date?: string;
                    views?: number;
                    created_at?: string;
                };
            };
            personal_details: {
                Row: PersonalDetails;
                Insert: Partial<Omit<PersonalDetails, 'id' | 'created_at' | 'updated_at'>>;
                Update: Partial<Omit<PersonalDetails, 'id' | 'created_at' | 'updated_at'>>;
            };
            educations: {
                Row: Education;
                Insert: Partial<Omit<Education, 'id' | 'created_at' | 'updated_at'>> & { school: string };
                Update: Partial<Omit<Education, 'id' | 'created_at' | 'updated_at'>>;
            };
            experiences: {
                Row: Experience;
                Insert: Partial<Omit<Experience, 'id' | 'created_at' | 'updated_at'>> & { company: string };
                Update: Partial<Omit<Experience, 'id' | 'created_at' | 'updated_at'>>;
            };
            language_activities: {
                Row: LanguageActivity;
                Insert: Partial<Omit<LanguageActivity, 'id' | 'created_at' | 'updated_at'>> & { name: string };
                Update: Partial<Omit<LanguageActivity, 'id' | 'created_at' | 'updated_at'>>;
            };
            certifications: {
                Row: Certification;
                Insert: Partial<Omit<Certification, 'id' | 'created_at' | 'updated_at'>> & { name: string };
                Update: Partial<Omit<Certification, 'id' | 'created_at' | 'updated_at'>>;
            };
            education_courses: {
                Row: EducationCourse;
                Insert: Partial<Omit<EducationCourse, 'id' | 'created_at' | 'updated_at'>> & { course_name: string };
                Update: Partial<Omit<EducationCourse, 'id' | 'created_at' | 'updated_at'>>;
            };
            awards: {
                Row: Award;
                Insert: Partial<Omit<Award, 'id' | 'created_at' | 'updated_at'>> & { name: string };
                Update: Partial<Omit<Award, 'id' | 'created_at' | 'updated_at'>>;
            };
            portfolio_items: {
                Row: PortfolioItem;
                Insert: Partial<Omit<PortfolioItem, 'id' | 'created_at' | 'updated_at'>> & { project_id: string };
                Update: Partial<Omit<PortfolioItem, 'id' | 'created_at' | 'updated_at'>>;
            };
            cover_letters: {
                Row: CoverLetter;
                Insert: Partial<Omit<CoverLetter, 'id' | 'created_at' | 'updated_at'>> & { title: string };
                Update: Partial<Omit<CoverLetter, 'id' | 'created_at' | 'updated_at'>>;
            };
            resume_presets: {
                Row: ResumePreset;
                Insert: Omit<ResumePreset, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<ResumePreset, 'id' | 'created_at' | 'updated_at'>>;
            };
        };
    };
};
