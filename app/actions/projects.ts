'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createPublicClient } from '@/utils/supabase/public'
import { isAuthenticated } from '@/utils/auth'
import { Project, ProjectContribution, ProjectDetail, ProjectSummary } from '@/types/database.types'
import { parseGithubPath } from '@/utils/github'
import { postSlug } from '@/utils/post'
import { optionalText } from '@/utils/form'

/** Shared by add and update so the two payloads cannot drift apart. */
function parseProjectForm(formData: FormData) {
    const title = formData.get('title') as string
    // /projects/[slug] 의 URL. 비워두면 제목에서 만든다. postSlug는 ASCII만 남기므로
    // 한글 전용 제목은 빈 문자열이 되고, 그 경우 임의 접미사로 채운다 (posts와 같은 규칙).
    const rawSlug = ((formData.get('slug') as string) ?? '').trim() || title
    let slug = postSlug(rawSlug)
    if (!slug) slug = `project-${Math.random().toString(36).slice(2, 8)}`

    return {
        slug,
        title,
        description: formData.get('description') as string,
        date: formData.get('date') as string,
        stack: (formData.get('stack') as string).split(',').map(s => s.trim()),
        github_link: formData.get('github_link') as string,
        content: formData.get('content') as string,
        // Optional English translations; null means "fall back to the original".
        title_en: optionalText(formData, 'title_en'),
        description_en: optionalText(formData, 'description_en'),
        content_en: optionalText(formData, 'content_en'),
        // Resume-only fields. The public site never reads these; the resume builder
        // uses `role`/`period_*` for the project section and `include_in_resume_default`
        // to seed its initial toggle state. See utils/resume/buildResumeData.ts.
        role: optionalText(formData, 'role'),
        period_start: optionalText(formData, 'period_start'),
        period_end: optionalText(formData, 'period_end'),
        include_in_resume_default: formData.get('include_in_resume_default') === 'on',
    }
}

/*
 * 홈 카드 그리드용. 마크다운 본문(content/content_en)은 빼고 카드가 실제로 그리는
 * 컬럼만 가져온다 — 상세가 모달이던 시절에는 본문이 필요했지만 이제 /projects/[slug]가
 * 따로 읽으므로, 여기서 실으면 프로젝트 전부의 README가 홈 payload에 딸려간다.
 * 블로그가 toListItem()으로 하는 것과 같은 이유다 (app/actions/posts.ts).
 */
const PROJECT_CARD_SELECT =
    'id, slug, title, title_en, description, description_en, stack, date, link, github_link, created_at'

export type ProjectCard = Pick<
    Project,
    'id' | 'slug' | 'title' | 'title_en' | 'description' | 'description_en'
    | 'stack' | 'date' | 'link' | 'github_link' | 'created_at'
>

export async function getProjects(): Promise<ProjectCard[]> {
    const supabase = createPublicClient()
    const { data, error } = await supabase
        .from('projects')
        .select(PROJECT_CARD_SELECT)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching projects:', error)
        return []
    }
    return (data ?? []) as unknown as ProjectCard[]
}

/*
 * 관리자 목록 — 편집 폼이 본문·역할·기간까지 그대로 채워야 하므로 전체 행을 읽는다.
 * getProjects()(카드용)를 쓰면 content/role/period_*가 undefined로 들어와 저장 시
 * 조용히 지워진다. 인증 클라이언트라 is_public=false 행도 보인다.
 */
export async function getProjectsAdmin(): Promise<Project[]> {
    if (!(await isAuthenticated())) return []

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching projects (admin):', error)
        return []
    }
    return data as Project[]
}

/**
 * 정적 생성·이전/다음·sitemap 공용. 본문도 스택도 필요 없다.
 * getPostSummaries()와 같은 역할. 순서는 홈 카드 그리드와 동일해야 이전/다음이 자연스럽다.
 */
export async function getProjectSummaries(): Promise<ProjectSummary[]> {
    const supabase = createPublicClient()
    const { data, error } = await supabase
        .from('projects')
        .select('slug, title, title_en, date, created_at')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching project summaries:', error)
        return []
    }
    return (data ?? []) as ProjectSummary[]
}

/**
 * 상세 페이지 1건 — 프로젝트 + 공개된 기여 목록.
 *
 * 기여는 별도 쿼리로 가져온다. 임베드(`project_contributions(*)`)를 쓰면 손으로 쓴
 * Database 타입에 관계 메타데이터가 없어 supabase-js가 형태를 추론하지 못한다.
 * 두 번 왕복하지만 병렬이 아니라 순차인 이유는 project.id가 있어야 기여를 찾기 때문.
 */
export async function getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
    const supabase = createPublicClient()

    const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

    if (error) {
        console.error('Error fetching project:', error)
        return null
    }
    if (!project) return null

    const { data: contributions, error: contribError } = await supabase
        .from('project_contributions')
        .select('*')
        .eq('project_id', (project as Project).id)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true })

    if (contribError) console.error('Error fetching contributions:', contribError)

    return {
        ...(project as Project),
        contributions: (contributions ?? []) as ProjectContribution[],
    }
}

export async function addProject(formData: FormData) {
    if (!(await isAuthenticated())) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from('projects')
        .insert(parseProjectForm(formData))

    if (error) {
        console.error('Error adding project:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/admin/projects')
    revalidatePath('/projects/[slug]', 'page')
    return { success: true }
}

export async function updateProject(formData: FormData) {
    if (!(await isAuthenticated())) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    const id = formData.get('id') as string

    const { error } = await supabase
        .from('projects')
        .update(parseProjectForm(formData))
        .eq('id', id)

    if (error) {
        console.error('Error updating project:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/admin/projects')
    revalidatePath('/projects/[slug]', 'page')
    return { success: true }
}

export async function deleteProject(id: string) {
    if (!(await isAuthenticated())) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting project:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/admin/projects')
    revalidatePath('/projects/[slug]', 'page')
    return { success: true }
}

/** Prefills the project form from a GitHub repo: name, description, date, README. */
export async function fetchGithubRepo(url: string) {
    try {
        const parsed = parseGithubPath(url)

        if (!parsed) {
            console.error('Invalid URL format:', url);
            return { success: false, error: 'Invalid URL format' };
        }

        const owner = encodeURIComponent(parsed.owner)
        const repo = encodeURIComponent(parsed.repo)

        // 1. Fetch Repo Info
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: {
                'User-Agent': 'Portfolio-App',
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!repoRes.ok) {
            const errorText = await repoRes.text();
            console.error('GitHub API Error:', repoRes.status, errorText);
            return { success: false, error: `Repository not found (${owner}/${repo}). Status: ${repoRes.status}` };
        }
        const repoData = await repoRes.json();

        // 2. Fetch README
        const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
            headers: {
                'User-Agent': 'Portfolio-App',
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        let readmeContent = '';
        if (readmeRes.ok) {
            const readmeData = await readmeRes.json();
            // Use Buffer for decoding in Node.js environment
            readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
        }

        return {
            success: true,
            data: {
                title: repoData.name,
                description: repoData.description || '',
                date: new Date(repoData.pushed_at).toISOString().slice(0, 7).replace('-', '.'), // YYYY.MM
                content: readmeContent
            }
        };

    } catch (error) {
        console.error('GitHub Fetch Error:', error);
        return { success: false, error: 'Failed to fetch data' };
    }
}
