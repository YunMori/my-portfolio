/*
 * 이력서 빌더 전용 스켈레톤 — 이 라우트는 11개 테이블을 조회하고 1.3MB짜리
 * react-pdf 청크를 받으므로 공용 스켈레톤보다 실제 레이아웃(좌 토글 / 우 미리보기)에
 * 가까운 모양을 보여주는 편이 전환이 덜 튄다.
 */
export default function ResumeBuilderLoading() {
    return (
        <div className="animate-pulse">
            <div className="h-10 w-80 rounded-lg bg-stone-800/70 mb-3"></div>
            <div className="h-4 w-full max-w-2xl rounded bg-stone-800/40 mb-8"></div>

            <div className="h-16 rounded-xl border border-stone-800 bg-surface mb-6"></div>

            <div className="grid lg:grid-cols-5 gap-6 items-start">
                <div className="lg:col-span-2 space-y-4">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className="h-14 rounded-xl border border-stone-800 bg-surface"></div>
                    ))}
                </div>
                <div className="lg:col-span-3">
                    <div className="rounded-xl border border-stone-800 bg-stone-950 h-[calc(100vh-180px)]"></div>
                </div>
            </div>
        </div>
    )
}
