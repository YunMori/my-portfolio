import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getProjectBySlug, getProjectSummaries } from '@/app/actions/projects'
import ProjectArticle from '@/components/projects/ProjectArticle'

/*
 * 프로젝트 케이스 스터디 — "이 프로젝트에서 내가 무엇을 했는가".
 *
 * 예전에는 홈의 모달이 GitHub README를 그대로 띄웠다. 그건 프로젝트 소개일 뿐 기여 내역이
 * 아니어서, 기여를 위로 올리고 README는 접어 두었다. 블로그 상세와 같은 구조 —
 * 서버 컴포넌트가 두 언어를 모두 담은 정적 HTML을 만들고, 클라이언트 자식이 골라 그린다
 * (URL에 로케일이 없으므로). 쿠키를 읽지 않는 public 클라이언트라 정적 생성이 가능하다.
 */
export async function generateStaticParams() {
    const projects = await getProjectSummaries()
    return projects.map(project => ({ slug: project.slug }))
}

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params
    const project = await getProjectBySlug(slug)
    if (!project) return { title: 'Not Found | Morifolio' }

    // 서버는 방문자가 고른 언어를 알 수 없다. <html lang="en">과 맞추려고 영어를 우선하고
    // 없으면 원문으로 떨어진다 (블로그 상세와 같은 이유로 pick()을 쓰지 않는다).
    const title = project.title_en || project.title
    const description = project.description_en || project.description

    return {
        title: `${title} | Morifolio`,
        description,
        openGraph: { title, description, type: 'article' },
    }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const project = await getProjectBySlug(slug)
    if (!project) notFound()

    // 이전/다음 — 홈 카드 그리드와 같은 순서(created_at desc)를 쓴다. 요약만 읽으므로
    // 다른 프로젝트의 본문이 딸려오지 않는다.
    const projects = await getProjectSummaries()
    const idx = projects.findIndex(p => p.slug === slug)
    const newer = idx > 0 ? projects[idx - 1] : null
    const older = idx >= 0 && idx < projects.length - 1 ? projects[idx + 1] : null

    return (
        <article className="bg-main min-h-screen pt-28 pb-24">
            <ProjectArticle project={project} older={older} newer={newer} />
        </article>
    )
}
