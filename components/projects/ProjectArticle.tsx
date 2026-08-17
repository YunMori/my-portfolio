'use client'

import Link from 'next/link'
import { useContentLanguage } from '@/i18n/ContentLanguage'
import { pick, pickLang } from '@/i18n/localize'
import type { ProjectDetail, ProjectSummary } from '@/types/database.types'
import PostBody from '@/components/blog/PostBody'
import ContributionList from './ContributionList'

/*
 * 페이지가 서버 컴포넌트로 남아 정적 생성되도록, 언어 선택만 이 클라이언트 컴포넌트가 맡는다.
 * 두 언어의 본문이 모두 정적 HTML에 실려 나가고 여기서 고른다 (PostArticle과 같은 구조).
 */
export default function ProjectArticle({ project, older, newer }: {
    project: ProjectDetail
    older: ProjectSummary | null
    newer: ProjectSummary | null
}) {
    const { language } = useContentLanguage()

    const title = pick(project, 'title', language)
    const description = pick(project, 'description', language)
    const content = pick(project, 'content', language)
    const bodyLang = pickLang(project, 'content', language)

    const period = project.period_start
        ? `${project.period_start} ~ ${project.period_end || '현재'}`
        : project.date

    return (
        <div className="max-w-3xl mx-auto px-6">
            <Link
                href="/#projects"
                className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-green-400 transition-colors mb-10"
            >
                <i className="fa-solid fa-arrow-left"></i> Projects
            </Link>

            <header className="mb-10">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono uppercase tracking-widest text-stone-500 mb-4">
                    <span>{period}</span>
                    {project.role && <><span aria-hidden>·</span><span>{project.role}</span></>}
                </div>

                <h1
                    lang={pickLang(project, 'title', language)}
                    className="text-3xl md:text-5xl font-display font-bold text-stone-100 leading-tight text-balance mb-6"
                >
                    {title}
                </h1>

                {description && (
                    <p lang={pickLang(project, 'description', language)} className="text-stone-400 text-lg leading-relaxed">
                        {description}
                    </p>
                )}

                {project.stack?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-6">
                        {project.stack.map(tech => (
                            <span key={tech} className="px-3 py-1 bg-stone-800 rounded-full text-xs text-stone-300 border border-stone-700">
                                {tech}
                            </span>
                        ))}
                    </div>
                )}

                {(project.github_link || project.link) && (
                    <div className="flex flex-wrap gap-3 mt-6">
                        {project.github_link && (
                            <a
                                href={project.github_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-bold text-stone-300 hover:text-white border border-stone-700 px-4 py-2 rounded-lg hover:border-stone-500 transition-colors"
                            >
                                <i className="fa-brands fa-github"></i> View Source
                            </a>
                        )}
                        {project.link && (
                            <a
                                href={project.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-bold text-stone-300 hover:text-white border border-stone-700 px-4 py-2 rounded-lg hover:border-stone-500 transition-colors"
                            >
                                <i className="fa-solid fa-arrow-up-right-from-square"></i> Live
                            </a>
                        )}
                    </div>
                )}
            </header>

            <div className="section-divider !mx-0 mb-12"></div>

            {/* 본론: 이 프로젝트에서 내가 한 일 */}
            <section className="mb-12">
                <h2 className="text-[11px] font-mono uppercase tracking-widest text-stone-500 mb-5">
                    My Contributions
                </h2>
                <ContributionList contributions={project.contributions} />
            </section>

            {/* 프로젝트 자체 설명(README)은 맥락일 뿐이라 접어 둔다 */}
            {content && (
                <details className="group rounded-xl border border-highlight bg-surface/40">
                    <summary className="cursor-pointer select-none px-5 py-4 text-sm font-bold text-stone-300 hover:text-stone-100 transition-colors">
                        <i className="fa-solid fa-chevron-right text-stone-600 mr-2 text-xs transition-transform group-open:rotate-90"></i>
                        프로젝트 소개 (README)
                    </summary>
                    <div className="px-5 pb-6 pt-1">
                        <PostBody content={content} lang={bodyLang} />
                    </div>
                </details>
            )}

            <nav className="mt-20 pt-10 border-t border-highlight grid sm:grid-cols-2 gap-4">
                {older ? (
                    <Link
                        href={`/projects/${encodeURIComponent(older.slug)}`}
                        className="group rounded-xl border border-highlight hover:border-green-500 bg-surface/50 p-5 transition-colors"
                    >
                        <span className="text-[11px] font-mono uppercase tracking-widest text-stone-500">Previous</span>
                        <p
                            lang={pickLang(older, 'title', language)}
                            className="mt-2 font-display font-bold text-stone-200 group-hover:text-green-400 transition-colors line-clamp-2"
                        >
                            {pick(older, 'title', language)}
                        </p>
                    </Link>
                ) : <span />}

                {newer ? (
                    <Link
                        href={`/projects/${encodeURIComponent(newer.slug)}`}
                        className="group rounded-xl border border-highlight hover:border-green-500 bg-surface/50 p-5 transition-colors sm:text-right"
                    >
                        <span className="text-[11px] font-mono uppercase tracking-widest text-stone-500">Next</span>
                        <p
                            lang={pickLang(newer, 'title', language)}
                            className="mt-2 font-display font-bold text-stone-200 group-hover:text-green-400 transition-colors line-clamp-2"
                        >
                            {pick(newer, 'title', language)}
                        </p>
                    </Link>
                ) : <span />}
            </nav>
        </div>
    )
}
