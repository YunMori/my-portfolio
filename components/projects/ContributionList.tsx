import type { ProjectContribution } from '@/types/database.types'
import { CATEGORY_MAP } from '@/utils/resume/config'

/*
 * 기여 목록. 이 페이지의 본론이다.
 *
 * `area`의 한국어 라벨은 관리자 폼의 select 옵션과 같은 곳(utils/resume/config.ts)에서
 * 읽는다 — 예전 포트폴리오 섹션은 라벨을 PDF에 따로 하드코딩해 두 벌이 서로 어긋나 있었다.
 */
const AREA_LABELS: Record<string, string> = Object.fromEntries(
    (CATEGORY_MAP['project_contributions']?.fields.find(f => f.name === 'area')?.options ?? [])
        .map(o => [o.value, o.label])
)

function Bullets({ items, marker }: { items: string[]; marker: string }) {
    if (items.length === 0) return null
    return (
        <ul className="mt-2 space-y-1.5">
            {items.map((line, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-stone-400 leading-relaxed">
                    <span aria-hidden className="text-green-500 shrink-0 mt-px">{marker}</span>
                    <span>{line}</span>
                </li>
            ))}
        </ul>
    )
}

export default function ContributionList({ contributions }: { contributions: ProjectContribution[] }) {
    if (contributions.length === 0) {
        return (
            <p className="text-stone-500 italic text-sm">
                아직 정리된 기여 내용이 없습니다.
            </p>
        )
    }

    return (
        <div className="space-y-5">
            {contributions.map(c => (
                <section
                    key={c.id}
                    className="rounded-xl border border-highlight bg-surface/60 p-6 transition-colors hover:border-green-500/40"
                >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                        <h3 className="font-display font-bold text-lg text-stone-100">{c.title}</h3>
                        {c.area && (
                            <span className="text-[11px] font-mono uppercase tracking-widest text-stone-500 shrink-0">
                                {AREA_LABELS[c.area] ?? c.area}
                            </span>
                        )}
                    </div>

                    {c.metric && (
                        <p className="mt-3 inline-block rounded-md bg-green-900/30 border border-green-600/30 px-3 py-1 font-mono text-sm text-green-400">
                            {c.metric}
                        </p>
                    )}

                    {c.problem && (
                        <p className="mt-4 text-sm text-stone-400 leading-relaxed">{c.problem}</p>
                    )}

                    {(c.actions?.length ?? 0) > 0 && (
                        <div className="mt-4">
                            <p className="text-[11px] font-mono uppercase tracking-widest text-stone-500">What I did</p>
                            <Bullets items={c.actions ?? []} marker="·" />
                        </div>
                    )}

                    {(c.outcome?.length ?? 0) > 0 && (
                        <div className="mt-4">
                            <p className="text-[11px] font-mono uppercase tracking-widest text-stone-500">Result</p>
                            <Bullets items={c.outcome ?? []} marker="→" />
                        </div>
                    )}
                </section>
            ))}
        </div>
    )
}
