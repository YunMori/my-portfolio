/*
 * admin 하위 세그먼트 공용 Suspense 경계.
 *
 * 이 파일이 없을 때는 admin 안쪽 어디에도 경계가 없어서 (1) 메뉴를 눌러도 서버 응답이
 * 올 때까지 화면이 그대로 멈춰 있었고, (2) 동적 라우트는 가장 가까운 loading 경계까지만
 * 프리페치되므로 사이드바 <Link>들의 prefetch가 사실상 아무 일도 하지 않았다.
 * 레이아웃(사이드바)은 유지되고 본문만 스켈레톤으로 바뀐다.
 */
export default function AdminLoading() {
    return (
        <div className="animate-pulse">
            <div className="h-10 w-72 rounded-lg bg-stone-800/70 mb-3"></div>
            <div className="h-4 w-96 rounded bg-stone-800/40 mb-10"></div>

            <div className="space-y-4">
                {[0, 1, 2].map(i => (
                    <div key={i} className="rounded-xl border border-stone-800 bg-surface p-5">
                        <div className="h-4 w-1/3 rounded bg-stone-800/70 mb-3"></div>
                        <div className="h-3 w-2/3 rounded bg-stone-800/40"></div>
                    </div>
                ))}
            </div>
        </div>
    )
}
