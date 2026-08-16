import Link from 'next/link'
import { RESUME_CATEGORIES } from '@/utils/resume/config'

// 이력서 아카이브 허브: 카테고리 목록
export default function ArchiveHubPage() {
    return (
        <div>
            <h1 className="text-4xl font-display font-bold mb-2 text-stone-100">Resume Archive</h1>
            <p className="text-stone-500 mb-12">이력서에 들어갈 모든 정보를 카테고리별로 관리합니다.</p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 기본 정보 + 인적 사항 (싱글턴) */}
                <Link
                    href="/admin/archive/basic"
                    className="group bg-surface hover:bg-stone-800 border border-stone-800 p-6 rounded-2xl transition-all hover:-translate-y-1 hover:border-green-500/50"
                >
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-3 group-hover:bg-green-500 group-hover:text-black transition-colors">
                        <i className="fa-solid fa-id-card"></i>
                    </div>
                    <h2 className="text-lg font-bold text-stone-200 mb-1">기본 정보 · 인적 사항</h2>
                    <p className="text-xs text-stone-500">이름, 연락처, 링크 / 생년월일, 주소, 병역 (비공개)</p>
                </Link>

                {/* 프로젝트는 기존 매니저 재사용 */}
                <Link
                    href="/admin/projects"
                    className="group bg-surface hover:bg-stone-800 border border-stone-800 p-6 rounded-2xl transition-all hover:-translate-y-1 hover:border-green-500/50"
                >
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-3 group-hover:bg-blue-500 group-hover:text-black transition-colors">
                        <i className="fa-solid fa-folder-open"></i>
                    </div>
                    <h2 className="text-lg font-bold text-stone-200 mb-1">프로젝트</h2>
                    <p className="text-xs text-stone-500">기존 프로젝트 관리 화면에서 편집</p>
                </Link>

                {RESUME_CATEGORIES.map(category => (
                    <Link
                        key={category.key}
                        href={`/admin/archive/${category.key}`}
                        className="group bg-surface hover:bg-stone-800 border border-stone-800 p-6 rounded-2xl transition-all hover:-translate-y-1 hover:border-green-500/50"
                    >
                        <div className="w-10 h-10 rounded-full bg-stone-500/10 flex items-center justify-center text-stone-400 mb-3 group-hover:bg-stone-500 group-hover:text-black transition-colors">
                            <i className={`fa-solid ${category.icon}`}></i>
                        </div>
                        <h2 className="text-lg font-bold text-stone-200 mb-1">
                            {category.labelKo}
                            {category.sensitive && <i className="fa-solid fa-lock text-amber-500/70 text-xs ml-2"></i>}
                        </h2>
                        <p className="text-xs text-stone-500">{category.labelEn}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}
