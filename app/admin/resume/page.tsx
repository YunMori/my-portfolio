import { getResumeBuilderData } from '@/app/actions/resume'
import { getPresets } from '@/app/actions/presets'
import ResumeBuilderShell from '@/components/admin/resume/ResumeBuilderShell'

// 이력서 빌더 (관리자 전용 — admin 레이아웃이 인증을 보장)
export default async function ResumeBuilderPage() {
    const [data, presets] = await Promise.all([getResumeBuilderData(), getPresets()])

    if (!data) {
        return <p className="text-stone-500">데이터를 불러올 수 없습니다. 다시 로그인해 주세요.</p>
    }

    return (
        <div>
            <h1 className="text-4xl font-display font-bold mb-2 text-stone-100">
                <i className="fa-solid fa-file-pdf text-stone-600 mr-3"></i>
                Resume Builder
            </h1>
            <p className="text-stone-500 mb-8">
                항목을 토글로 선택하면 우측 미리보기에 실시간 반영됩니다. 미리보기가 곧 최종 PDF입니다.
            </p>

            <ResumeBuilderShell data={data} initialPresets={presets} />
        </div>
    )
}
