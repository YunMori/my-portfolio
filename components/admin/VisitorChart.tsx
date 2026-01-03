'use client';

import { useEffect, useState } from 'react';
import { getAnalyticsData } from '@/app/actions';

export default function VisitorChart() {
    const [data, setData] = useState<{ date: string; views: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAnalyticsData().then((res: any) => {
            setData(res || []);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="h-40 flex items-center justify-center text-xs text-stone-600">Loading stats...</div>;
    if (data.length === 0) return <div className="h-40 flex items-center justify-center text-xs text-stone-600">No data available</div>;

    const maxViews = Math.max(...data.map(d => d.views), 1); // Avoid div by zero

    return (
        <div className="w-full h-40 flex items-end gap-2 pt-4 pb-2">
            {data.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-2 group relative">
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-stone-800 text-xs px-2 py-1 rounded border border-stone-700 transition-opacity whitespace-nowrap z-10">
                        {d.date}: <span className="text-khaki-500 font-bold">{d.views}</span>
                    </div>
                    {/* Bar */}
                    <div
                        className="w-full bg-stone-800 hover:bg-khaki-500/50 transition-all rounded-t-sm relative group-hover:shadow-[0_0_10px_rgba(212,212,216,0.2)]"
                        style={{ height: `${(d.views / maxViews) * 100}%` }}
                    ></div>
                    {/* Label */}
                    <span className="text-[10px] text-stone-600 font-mono hidden sm:block md:hidden lg:block truncate w-full text-center">
                        {d.date.slice(5).replace('-', '/')}
                    </span>
                </div>
            ))}
        </div>
    );
}
