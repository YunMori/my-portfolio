import { notFound } from 'next/navigation'
import { getCategory } from '@/utils/resume/config'
import { getResumeItemsAdmin, getProjectOptions } from '@/app/actions/resume'
import ResumeItemManager from '@/components/admin/resume/ResumeItemManager'

export default async function ArchiveCategoryPage(
    { params }: { params: Promise<{ category: string }> }
) {
    const { category: categoryKey } = await params
    const category = getCategory(categoryKey)
    if (!category) notFound()

    // 포트폴리오 상세는 프로젝트 선택 옵션이 필요
    const needsProjects = category.fields.some(f => f.type === 'project')
    const [items, projectOptions] = await Promise.all([
        getResumeItemsAdmin(category.key),
        needsProjects ? getProjectOptions() : Promise.resolve([]),
    ])

    return (
        <div>
            <h1 className="text-4xl font-display font-bold mb-2 text-stone-100">
                <i className={`fa-solid ${category.icon} text-stone-600 mr-3`}></i>
                {category.labelKo}
            </h1>
            <p className="text-stone-500 mb-12">{category.labelEn} — 이력서 아카이브</p>

            <ResumeItemManager
                category={category}
                initialItems={items}
                projectOptions={projectOptions}
            />
        </div>
    )
}
