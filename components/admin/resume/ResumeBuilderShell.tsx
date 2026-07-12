'use client'

// react-pdf(~수백 KB)를 빌더 진입 시에만 로드하기 위한 dynamic 래퍼
// (HomeClient의 Projects dynamic 패턴과 동일)
import dynamic from 'next/dynamic'
import type { ResumeBuilderData } from '@/app/actions/resume'

const ResumeBuilder = dynamic(() => import('./ResumeBuilder'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-64 text-stone-500">
            <i className="fa-solid fa-spinner fa-spin mr-3"></i> 이력서 빌더를 불러오는 중...
        </div>
    ),
})

export default function ResumeBuilderShell({ data }: { data: ResumeBuilderData }) {
    return <ResumeBuilder data={data} />
}
