type DailyViews = { date: string; views: number };

// Presentational only — the dashboard fetches on the server and passes the week
// in, so there is no loading state and nothing here needs to run on the client.
export default function VisitorChart({ data }: { data: DailyViews[] }) {
    // getAnalyticsData zero-fills a full week, so an empty array only means a query error.
    if (data.length === 0) return <div className="h-40 flex items-center justify-center text-xs text-stone-600">No data available</div>;
    // A brand new (or freshly reset) table returns seven zeroes — seven invisible
    // bars read as a broken chart, so say it out loud instead.
    if (data.every(d => d.views === 0)) return <div className="h-40 flex items-center justify-center text-xs text-stone-600">아직 방문 기록이 없습니다</div>;

    const maxViews = Math.max(...data.map(d => d.views), 1); // Avoid div by zero

    return (
        <div>
            <p className="text-[10px] font-mono text-stone-600 text-right mb-1">max {maxViews}</p>
            <div className="w-full h-40 flex items-stretch gap-2 pb-2">
                {data.map((d) => (
                    <div key={d.date} className="flex-1 flex flex-col group relative">
                        {/* Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-stone-800 text-xs px-2 py-1 rounded border border-stone-700 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                            {d.date}: <span className="text-green-500 font-bold">{d.views}</span>
                        </div>
                        {/*
                            Track. `flex-1` inside a fixed-height (h-40) column gives this a
                            DEFINITE height, which is what makes the bar's percentage height
                            resolve. Setting the percentage against an auto-height parent —
                            as this component used to — resolves to 0px and the bars vanish.
                        */}
                        <div className="flex-1 min-h-0 flex items-end">
                            <div
                                className="w-full bg-stone-800 group-hover:bg-green-500/50 transition-all rounded-t-sm group-hover:shadow-[0_0_10px_rgba(212,212,216,0.2)]"
                                style={{
                                    height: `${(d.views / maxViews) * 100}%`,
                                    // Keep low-but-nonzero days visible; a true zero stays flat.
                                    minHeight: d.views > 0 ? '2px' : '0',
                                }}
                            ></div>
                        </div>
                        {/* Label */}
                        <span className="mt-2 text-[10px] text-stone-600 font-mono hidden sm:block truncate w-full text-center">
                            {d.date.slice(5).replace('-', '/')}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
