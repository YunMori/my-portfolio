export default function ProjectLoading() {
    return (
        <div className="bg-main min-h-screen pt-28 pb-24">
            <div className="max-w-3xl mx-auto px-6 animate-pulse">
                <div className="h-4 w-24 rounded bg-stone-800/70 mb-10"></div>
                <div className="h-3 w-40 rounded bg-stone-800/50 mb-4"></div>
                <div className="h-12 w-3/4 rounded-lg bg-stone-800/70 mb-6"></div>
                <div className="h-5 w-full rounded bg-stone-800/40 mb-2"></div>
                <div className="h-5 w-2/3 rounded bg-stone-800/40 mb-10"></div>

                <div className="space-y-5">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="rounded-xl border border-highlight bg-surface/60 p-6">
                            <div className="h-5 w-1/2 rounded bg-stone-800/70 mb-4"></div>
                            <div className="h-3 w-full rounded bg-stone-800/40 mb-2"></div>
                            <div className="h-3 w-5/6 rounded bg-stone-800/40"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
