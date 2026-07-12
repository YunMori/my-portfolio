'use client'

// 이력서 빌더: 좌측 토글 패널 + 우측 실시간 PDF 미리보기 (미리보기 = 실제 PDF)
// 이 컴포넌트는 ResumeBuilderShell에서 dynamic(ssr:false)로 로드된다 (react-pdf 번들 격리)
import { useState, useEffect, useMemo } from 'react'
import { PDFViewer, pdf } from '@react-pdf/renderer'
import { toast } from 'sonner'
import ResumePdfDocument from '@/components/resume/ResumePdfDocument'
import { registerResumeFonts } from '@/utils/resume/pdfFonts'
import {
    buildResumeData, defaultSelections, sanitizeSelections,
    ResumeSelections, BasicFieldKey, ToggleCategoryKey,
} from '@/utils/resume/buildResumeData'
import { CATEGORY_MAP } from '@/utils/resume/config'
import { savePreset, deletePreset } from '@/app/actions/presets'
import type { ResumeBuilderData } from '@/app/actions/resume'
import { ResumePreset } from '@/types/database.types'

// 한글 폰트 등록 (클라이언트 모듈 로드 시 1회)
registerResumeFonts()

const BASIC_FIELD_LABELS: { key: BasicFieldKey; label: string; sensitive?: boolean }[] = [
    { key: 'photo', label: '사진' },
    { key: 'email', label: '이메일' },
    { key: 'github', label: 'GitHub' },
    { key: 'blog', label: '블로그' },
    { key: 'phone', label: '전화번호', sensitive: true },
    { key: 'birth_date', label: '생년월일', sensitive: true },
    { key: 'address', label: '주소', sensitive: true },
    { key: 'military_service', label: '병역', sensitive: true },
]

type SectionItem = { id: string; title: string; subtitle: string }
type BuilderSection = { key: ToggleCategoryKey; label: string; icon: string; items: SectionItem[] }

// 카테고리별 토글 리스트 데이터 구성
function buildSections(data: ResumeBuilderData): BuilderSection[] {
    const label = (key: string) => CATEGORY_MAP[key]?.labelKo ?? key
    const icon = (key: string) => CATEGORY_MAP[key]?.icon ?? 'fa-list'

    const fromCategory = (key: ToggleCategoryKey, items: Record<string, unknown>[]): BuilderSection => {
        const category = CATEGORY_MAP[key]
        return {
            key,
            label: label(key),
            icon: icon(key),
            items: items.map(item => ({
                id: item.id as string,
                title: (item[category.titleField] as string) || '(제목 없음)',
                subtitle: category.subtitleFields
                    .map(f => item[f])
                    .filter(v => v != null && v !== '')
                    .join(' | '),
            })),
        }
    }

    return [
        {
            key: 'projects',
            label: '프로젝트',
            icon: 'fa-folder-open',
            items: data.projects.map(p => ({
                id: p.id,
                title: p.title,
                subtitle: [p.role, p.period_start ? `${p.period_start} ~ ${p.period_end ?? ''}` : p.date]
                    .filter(Boolean).join(' | '),
            })),
        },
        fromCategory('educations', data.educations as unknown as Record<string, unknown>[]),
        fromCategory('experiences', data.experiences as unknown as Record<string, unknown>[]),
        fromCategory('language_activities', data.languageActivities as unknown as Record<string, unknown>[]),
        fromCategory('certifications', data.certifications as unknown as Record<string, unknown>[]),
        fromCategory('education_courses', data.educationCourses as unknown as Record<string, unknown>[]),
        fromCategory('awards', data.awards as unknown as Record<string, unknown>[]),
        fromCategory('portfolio_items', data.portfolioItems as unknown as Record<string, unknown>[]),
        fromCategory('cover_letters', data.coverLetters as unknown as Record<string, unknown>[]),
    ]
}

export default function ResumeBuilder({ data, initialPresets }: {
    data: ResumeBuilderData
    initialPresets: ResumePreset[]
}) {
    // 초기 토글 상태 = 각 항목의 include_in_resume_default
    const [selections, setSelections] = useState<ResumeSelections>(() => defaultSelections(data))
    const [isExporting, setIsExporting] = useState(false)

    // 프리셋 상태
    const [presets, setPresets] = useState<ResumePreset[]>(initialPresets)
    const [selectedPresetId, setSelectedPresetId] = useState('')
    const [presetName, setPresetName] = useState('')
    const [isSavingPreset, setIsSavingPreset] = useState(false)

    // 미리보기 재렌더 디바운스 (~400ms): 토글 연타 시 PDF 렌더 부하 방지
    const [debouncedSelections, setDebouncedSelections] = useState(selections)
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSelections(selections), 400)
        return () => clearTimeout(timer)
    }, [selections])

    const sections = useMemo(() => buildSections(data), [data])
    const previewData = useMemo(
        () => buildResumeData(data, debouncedSelections),
        [data, debouncedSelections],
    )

    const toggleItem = (category: ToggleCategoryKey, id: string, checked: boolean) => {
        setSelections(prev => ({
            ...prev,
            items: {
                ...prev.items,
                [category]: checked
                    ? [...prev.items[category], id]
                    : prev.items[category].filter(i => i !== id),
            },
        }))
    }

    const toggleBasicField = (key: BasicFieldKey, checked: boolean) => {
        setSelections(prev => ({
            ...prev,
            basicFields: { ...prev.basicFields, [key]: checked },
        }))
    }

    // 프리셋 저장: 현재 토글 상태를 이름으로 저장 (동명 프리셋은 덮어쓰기)
    const handleSavePreset = async () => {
        const name = presetName.trim()
        if (!name) {
            toast.error('프리셋 이름을 입력하세요')
            return
        }
        setIsSavingPreset(true)
        try {
            const result = await savePreset(name, selections)
            if (result.success && result.preset) {
                const saved = result.preset
                setPresets(prev => {
                    const others = prev.filter(p => p.id !== saved.id)
                    return [saved, ...others]
                })
                setSelectedPresetId(saved.id)
                setPresetName('')
                toast.success(`프리셋 "${name}" 저장 완료`)
            } else {
                toast.error(result.error || '프리셋 저장에 실패했습니다')
            }
        } catch (err) {
            console.error(err)
            toast.error('예기치 못한 오류가 발생했습니다')
        } finally {
            setIsSavingPreset(false)
        }
    }

    // 프리셋 불러오기: 삭제된 항목 id는 sanitizeSelections가 조용히 필터
    const handleLoadPreset = (presetId: string) => {
        setSelectedPresetId(presetId)
        if (!presetId) return
        const preset = presets.find(p => p.id === presetId)
        if (!preset) return
        setSelections(sanitizeSelections(preset.selections as Partial<ResumeSelections>, data))
        toast.success(`프리셋 "${preset.name}" 적용됨`)
    }

    const handleDeletePreset = async () => {
        if (!selectedPresetId) return
        const preset = presets.find(p => p.id === selectedPresetId)
        if (!preset || !confirm(`프리셋 "${preset.name}"을(를) 삭제하시겠습니까?`)) return

        const result = await deletePreset(selectedPresetId)
        if (result.success) {
            setPresets(prev => prev.filter(p => p.id !== selectedPresetId))
            setSelectedPresetId('')
            toast.success('프리셋이 삭제되었습니다')
        } else {
            toast.error(result.error || '삭제에 실패했습니다')
        }
    }

    // PDF export: 현재 토글 상태(디바운스 미적용) 기준으로 즉시 생성
    const handleExport = async () => {
        setIsExporting(true)
        try {
            const exportData = buildResumeData(data, selections)
            const blob = await pdf(<ResumePdfDocument data={exportData} />).toBlob()
            const url = URL.createObjectURL(blob)

            const today = new Date()
            const dateStamp = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
            const anchor = document.createElement('a')
            anchor.href = url
            anchor.download = `${exportData.name || '이력서'}_이력서_${dateStamp}.pdf`
            anchor.click()
            URL.revokeObjectURL(url)

            toast.success('PDF가 다운로드되었습니다')
        } catch (err) {
            console.error('PDF export error:', err)
            toast.error('PDF 생성에 실패했습니다')
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* 상단 바: 프리셋 + export */}
            <div className="flex flex-wrap items-center gap-3 bg-surface border border-stone-800 rounded-xl p-4">
                <div className="flex items-center gap-2 flex-wrap flex-1">
                    <i className="fa-solid fa-bookmark text-stone-500"></i>
                    <select
                        value={selectedPresetId}
                        onChange={e => handleLoadPreset(e.target.value)}
                        className="bg-stone-900 border border-stone-700 rounded p-2 text-sm text-stone-200 focus:border-green-500 outline-none min-w-40"
                    >
                        <option value="">프리셋 불러오기...</option>
                        {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {selectedPresetId && (
                        <button
                            onClick={handleDeletePreset}
                            className="text-xs px-3 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded border border-red-900/30"
                            title="선택된 프리셋 삭제"
                        >
                            <i className="fa-solid fa-trash"></i>
                        </button>
                    )}

                    <span className="w-px h-6 bg-stone-800 mx-1 hidden sm:block"></span>

                    <input
                        type="text"
                        value={presetName}
                        onChange={e => setPresetName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSavePreset() }}
                        placeholder='프리셋 이름 (예: "백엔드 지원용")'
                        className="bg-stone-900 border border-stone-700 rounded p-2 text-sm text-stone-200 focus:border-green-500 outline-none flex-1 min-w-48"
                    />
                    <button
                        onClick={handleSavePreset}
                        disabled={isSavingPreset}
                        className="text-sm px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white font-bold rounded disabled:opacity-50 whitespace-nowrap"
                    >
                        {isSavingPreset ? <i className="fa-solid fa-spinner fa-spin"></i> : '현재 조합 저장'}
                    </button>
                </div>

                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-black font-bold text-sm transition-colors disabled:opacity-50"
                >
                    {isExporting
                        ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>생성 중...</>
                        : <><i className="fa-solid fa-file-arrow-down mr-2"></i>PDF로 내보내기</>}
                </button>
            </div>

            <div className="grid lg:grid-cols-5 gap-6 items-start">
                {/* 좌측: 토글 패널 */}
                <div className="lg:col-span-2 space-y-4 lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto pr-1">
                    {/* 기본 정보 필드 토글 */}
                    <details open className="bg-surface rounded-xl border border-stone-800">
                        <summary className="cursor-pointer select-none px-4 py-3 font-bold text-sm text-stone-300">
                            <i className="fa-solid fa-id-card text-stone-500 mr-2"></i>기본 정보
                        </summary>
                        <div className="px-4 pb-4 space-y-2">
                            {BASIC_FIELD_LABELS.map(({ key, label, sensitive }) => (
                                <label key={key} className="flex items-center justify-between gap-2 text-sm text-stone-400 cursor-pointer hover:text-stone-200">
                                    <span>
                                        {label}
                                        {sensitive && <i className="fa-solid fa-lock text-amber-500/60 text-[10px] ml-1.5" title="민감정보 — 기본 제외"></i>}
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={selections.basicFields[key]}
                                        onChange={e => toggleBasicField(key, e.target.checked)}
                                        className="accent-green-500"
                                    />
                                </label>
                            ))}
                        </div>
                    </details>

                    {/* 카테고리별 항목 토글 */}
                    {sections.map(section => (
                        <details key={section.key} open={section.items.length > 0} className="bg-surface rounded-xl border border-stone-800">
                            <summary className="cursor-pointer select-none px-4 py-3 font-bold text-sm text-stone-300">
                                <i className={`fa-solid ${section.icon} text-stone-500 mr-2`}></i>
                                {section.label}
                                <span className="text-stone-600 font-normal ml-2">
                                    {selections.items[section.key].length}/{section.items.length}
                                </span>
                            </summary>
                            <div className="px-4 pb-4 space-y-2">
                                {section.items.length === 0 && (
                                    <p className="text-xs text-stone-600">등록된 항목이 없습니다. Resume Archive에서 추가하세요.</p>
                                )}
                                {section.items.map(item => (
                                    <label key={item.id} className="flex items-start justify-between gap-3 text-sm cursor-pointer group">
                                        <span className="min-w-0">
                                            <span className="block text-stone-300 group-hover:text-stone-100 truncate">{item.title}</span>
                                            {item.subtitle && <span className="block text-xs text-stone-600 truncate">{item.subtitle}</span>}
                                        </span>
                                        <input
                                            type="checkbox"
                                            checked={selections.items[section.key].includes(item.id)}
                                            onChange={e => toggleItem(section.key, item.id, e.target.checked)}
                                            className="accent-green-500 mt-1 shrink-0"
                                        />
                                    </label>
                                ))}
                            </div>
                        </details>
                    ))}
                </div>

                {/* 우측: 실시간 PDF 미리보기 (미리보기 = 실제 PDF, 드리프트 없음) */}
                <div className="lg:col-span-3 lg:sticky lg:top-6">
                    <div className="rounded-xl overflow-hidden border border-stone-800 bg-stone-950">
                        <PDFViewer
                            key="resume-preview"
                            style={{ width: '100%', height: 'calc(100vh - 180px)', border: 'none' }}
                            showToolbar
                        >
                            <ResumePdfDocument data={previewData} />
                        </PDFViewer>
                    </div>
                </div>
            </div>
        </div>
    )
}
