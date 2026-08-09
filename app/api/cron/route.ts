import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel Cron이 접근할 수 있도록 동적 라우트로 설정
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Vercel Cron은 CRON_SECRET 환경변수 설정 시 Authorization 헤더를 자동으로 붙여준다.
    // 시크릿이 없거나 불일치하면 거부 (fail-closed)
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

        // Supabase DB가 잠들지 않도록(Sleep 방지) 아무 테이블이나 가볍게 1건 조회.
        // 결과 자체는 쓰지 않고, 쿼리가 성공했다는 사실만 확인한다.
        const { error } = await supabase
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
