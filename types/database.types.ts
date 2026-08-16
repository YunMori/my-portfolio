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
    // 이력서 "기본 정보" 확장. 전화번호가 여기 없는 것은 의도적이다 — profile은 공개 SELECT
    // 정책이라 anon key로도 읽히므로, 민감 필드는 PersonalDetails에 따로 둔다.
    // See supabase/migrations/20260816_01_resume_platform.sql.
    one_liner?: string | null;
    email?: string | null;
    blog_url?: string | null;
    user_id?: string | null;
    created_at?: string;
    updated_at?: string;
}

// The base text columns below (`title`, `description`, `content`, `name`) hold the
// Korean original; each `_en` sibling is an optional English translation that the
// admin panel fills in. Read them through `pick()` in i18n/localize.ts, which falls
// back to the original when the translation is missing.
// See supabase/migrations/20260809_04_i18n_content.sql.
export type Project = {
    id: string;
    title: string;
    title_en: string | null;
    description: string;
    description_en: string | null;
    stack: string[];
    date: string;
    image_url?: string;
    link?: string;
    github_link?: string;
    content?: string;
    content_en?: string | null;
    created_at?: string;
    // 이력서 확장 필드. 전부 additive라 기존 프로젝트 화면에는 영향이 없다.
    // See supabase/migrations/20260816_01_resume_platform.sql.
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

export type Category = {
    id: string;
    name: string;
    name_en: string | null;
    slug: string;
    sort_order: number;
    created_at?: string;
}

// The slice of a category carried on a post. `sort_order` comes along so chips
// render in the same order as the blog filter row.
export type PostCategory = Pick<Category, 'id' | 'name' | 'name_en' | 'slug' | 'sort_order'>

export type Post = {
    id: string;
    title: string;
    title_en: string | null;
    slug: string;
    description: string;
    description_en: string | null;
    content: string;
    content_en: string | null;
    published: boolean;
    // `date` column, so the API always returns 'YYYY-MM-DD'. Nullable: the admin
    // form allows leaving it blank. Render it through formatPostDate().
    date: string | null;
    created_at?: string;
    // Built from the post_categories join by normalizePost() in app/actions.ts, so
    // it is always present (possibly empty). Not a real column — excluded from
    // Insert/Update payloads.
    categories: PostCategory[];
}

// A post as the blog list renders it: everything except the markdown body,
// which is replaced by the reading-time estimate derived from it server-side.
// Both language bodies are dropped — the list never renders either one — and each
// contributes a reading-time estimate instead. `readingMinutesEn` is null when the
// post has no English translation, in which case the reader sees the original and
// `readingMinutes` describes it. Returned by getPosts().
export type PostListItem = Omit<Post, 'content' | 'content_en'> & {
    readingMinutes: number;
    readingMinutesEn: number | null;
};

// Just enough of a post to list or link to it, without dragging the markdown
// body along. Returned by getPostSummaries().
export type PostSummary = Pick<Post, 'slug' | 'title' | 'title_en' | 'date' | 'created_at'>;

// Many-to-many link between posts and categories. See supabase/migrations/20260809_02_multi_category.sql.
export type PostCategoryLink = {
    post_id: string;
    category_id: string;
}

// --- 이력서 아카이브 ---

// 모든 이력서 카테고리 테이블이 공유하는 메타 필드.
// `display_order`는 아카이브 화면의 드래그 정렬이, `include_in_resume_default`는
// 빌더의 초기 토글 상태(utils/resume/buildResumeData.ts의 defaultSelections)가 쓴다.
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

// 인적 사항 (민감정보 — RLS가 소유자 전용, 공개 조회 불가)
export type PersonalDetails = ResumeMeta & {
    birth_date: string | null;
    address: string | null;
    military_service: string | null;
    phone: string | null;
}

export type Education = ResumeMeta & {
    school: string;
    major: string | null;
    degree: string | null;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
}

export type Experience = ResumeMeta & {
    company: string;
    position: string | null;
    start_date: string | null;
    end_date: string | null;
    summary: string | null;
    achievements: string[] | null;
}

// 어학 / 동아리 / 대외활동
export type LanguageActivity = ResumeMeta & {
    activity_type: 'language' | 'club' | 'external' | null;
    name: string;
    score_or_desc: string | null;
    activity_date: string | null;
}

export type Certification = ResumeMeta & {
    name: string;
    issuer: string | null;
    acquired_date: string | null;
    cert_number: string | null;
}

export type EducationCourse = ResumeMeta & {
    course_name: string;
    institution: string | null;
    start_date: string | null;
    end_date: string | null;
    summary: string | null;
}

export type Award = ResumeMeta & {
    name: string;
    awarded_date: string | null;
    rank: string | null;
    description: string | null;
}

// 프로젝트 1:N 상세 자료
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

// 자기소개서 (민감정보 — RLS가 소유자 전용)
export type CoverLetter = ResumeMeta & {
    title: string;
    question: string | null;
    answer: string | null;
    char_limit: number | null;
}

/**
 * 저장된 이력서 버전 — 불변 스냅샷.
 *
 * `snapshot`은 저장 시점의 ResumeData(utils/resume/buildResumeData.ts) 전체를 그대로
 * 담는다. 아카이브를 나중에 고치거나 항목을 지워도 이 값은 변하지 않으므로, "그때 그
 * 회사에 낸 이력서"를 언제든 같은 내용으로 다시 뽑을 수 있다.
 *
 * `selections`는 그와 별개로 토글 상태만 들고 있어서, 최신 아카이브 위에 같은 구성을
 * 복원해 이어서 편집할 때 쓴다 (sanitizeSelections가 삭제된 id를 걸러낸다).
 *
 * 두 필드 모두 jsonb라 여기서는 구조를 느슨하게 두고, 소비하는 쪽에서 좁힌다.
 * See supabase/migrations/20260816_02_resume_versions.sql.
 */
export type ResumeVersion = {
    id: string;
    user_id?: string | null;
    version_no: number;
    label: string | null;
    note: string | null;
    selections: unknown;
    snapshot: unknown;
    created_at: string;
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
            categories: {
                Row: Category;
                Insert: Omit<Category, 'id' | 'created_at'>;
                Update: Partial<Omit<Category, 'id' | 'created_at'>>;
            };
            posts: {
                Row: Post;
                Insert: Omit<Post, 'id' | 'created_at' | 'categories'>;
                Update: Partial<Omit<Post, 'id' | 'created_at' | 'categories'>>;
            };
            post_categories: {
                Row: PostCategoryLink;
                Insert: PostCategoryLink;
                Update: Partial<PostCategoryLink>;
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
            resume_versions: {
                Row: ResumeVersion;
                Insert: Omit<ResumeVersion, 'id' | 'created_at'>;
                // 스냅샷은 불변 — 사후 수정은 label/note 까지만.
                Update: Partial<Pick<ResumeVersion, 'label' | 'note'>>;
            };
        };
    };
};
