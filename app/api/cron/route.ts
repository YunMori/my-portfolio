import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel Cron이 접근할 수 있도록 동적 라우트로 설정
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json(
                { error: 'Supabase credentials missing' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Supabase DB가 잠들지 않도록(Sleep 방지) 아무 테이블이나 가볍게 1건 조회
        const { data, error } = await supabase
            .from('profile')
            .select('id')
            .limit(1);

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            message: 'Supabase successfully pinged to prevent sleep mode.',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json(
            { error: 'Failed to ping Supabase' },
            { status: 500 }
        );
    }
}
