'use server'

import { createClient } from '@/utils/supabase/server'

export async function incrementView() {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase.rpc('increment_view', { target_date: today })

    if (error) {
        // Fallback if the RPC is missing (see supabase/migrations/20260809_01_analytics_rpc.sql).
        // Read-modify-write, so it may undercount under concurrency — but unlike the
        // previous `ignoreDuplicates` upsert it does not silently drop every view
        // after the day's first one.
        console.warn('increment_view RPC failed, falling back:', error.message)
        const { data: row } = await supabase
            .from('daily_stats')
            .select('views')
            .eq('date', today)
            .maybeSingle()

        await supabase
            .from('daily_stats')
            .upsert({ date: today, views: (row?.views ?? 0) + 1 }, { onConflict: 'date' })
    }
}

export async function getAnalyticsData() {
    const supabase = await createClient()
    // Last 7 calendar days in UTC, matching the dates incrementView writes.
    const days = [...Array(7)].map((_, i) => {
        const d = new Date()
        d.setUTCDate(d.getUTCDate() - (6 - i))
        return d.toISOString().split('T')[0]
    })

    const { data, error } = await supabase
        .from('daily_stats')
        .select('date, views')
        .gte('date', days[0])
        .order('date', { ascending: true })

    if (error) {
        console.error('Error fetching analytics:', error)
        return []
    }

    // Days without visits have no row; fill them with 0 so the chart always spans a full week.
    const viewsByDate = new Map(data.map(d => [d.date, d.views]))
    return days.map(date => ({ date, views: viewsByDate.get(date) ?? 0 }))
}
