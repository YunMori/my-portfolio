import { getBasicInfoAdmin } from '@/app/actions/resume'
import BasicInfoManager from '@/components/admin/resume/BasicInfoManager'

export default async function BasicInfoPage() {
    const { profile, personalDetails } = await getBasicInfoAdmin()

    return (
        <div>
            <h1 className="text-4xl font-display font-bold mb-2 text-stone-100">
                <i className="fa-solid fa-id-card text-stone-600 mr-3"></i>
                기본 정보 · 인적 사항
            </h1>
            <p className="text-stone-500 mb-12">이력서 상단에 들어가는 기본 정보와 비공개 인적 사항을 관리합니다.</p>

            <BasicInfoManager initialProfile={profile} initialPersonalDetails={personalDetails} />
        </div>
    )
}
