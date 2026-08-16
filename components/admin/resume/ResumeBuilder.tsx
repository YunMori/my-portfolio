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
    ResumeSelections, ResumeData, BasicFieldKey, ToggleCategoryKey,
} from '@/utils/resume/buildResumeData'
import { CATEGORY_MAP } from '@/utils/resume/config'
import { saveVersion, deleteVersion } from '@/app/actions/versions'
import type { ResumeBuilderData } from '@/app/actions/resume'
import { ResumeVersion } from '@/types/database.types'

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

function dateStamp(iso?: string) {
    const d = iso ? new Date(iso) : new Date()
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

function formatDateTime(iso: string) {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function ResumeBuilder({ data, initialVersions }: {
    data: ResumeBuilderData
    initialVersions: ResumeVersion[]
}) {
    // 초기 토글 상태 = 각 항목의 include_in_resume_default
    const [selections, setSelections] = useState<ResumeSelections>(() => defaultSelections(data))
    const [isExporting, setIsExporting] = useState(false)

    // 버전 상태
    const [versions, setVersions] = useState<ResumeVersion[]>(initialVersions)
    const [versionLabel, setVersionLabel] = useState('')
    const [versionNote, setVersionNote] = useState('')
    const [isSavingVersion, setIsSavingVersion] = useState(false)
    const [busyVersionId, setBusyVersionId] = useState<string | null>(null)

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

    const nextVersionNo = useMemo(
        () => versions.reduce((max, v) => Math.max(max, v.version_no), 0) + 1,
        [versions],
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

    // PDF 생성 → 다운로드. 라이브 상태와 저장된 스냅샷이 같은 경로를 쓴다.
    const downloadPdf = async (resume: ResumeData, filename: string) => {
        const blob = await pdf(<ResumePdfDocument data={resume} />).toBlob()
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = filename
        anchor.click()
        URL.revokeObjectURL(url)
    }

    // 현재 토글 상태(디바운스 미적용) 기준으로 즉시 생성
    const handleExport = async () => {
        setIsExporting(true)
        try {
            const exportData = buildResumeData(data, selections)
            await downloadPdf(exportData, `${exportData.name || '이력서'}_이력서_${dateStamp()}.pdf`)
            toast.success('PDF가 다운로드되었습니다')
        } catch (err) {
            console.error('PDF export error:', err)
            toast.error('PDF 생성에 실패했습니다')
        } finally {
            setIsExporting(false)
        }
    }

    /**
     * 현재 상태를 새 버전으로 저장.
     *
     * selections(재편집용)와 snapshot(그 시점 내용 전체)을 함께 넣는다. 스냅샷이 있어야
     * 나중에 아카이브를 고쳐도 "그때 제출한 그 이력서"를 그대로 다시 뽑을 수 있다.
     */
    const handleSaveVersion = async () => {
        setIsSavingVersion(true)
        try {
            const snapshot = buildResumeData(data, selections)
            const result = await saveVersion(versionLabel, versionNote, selections, snapshot)
            if (result.success && result.version) {
                setVersions(prev => [result.version!, ...prev])
                setVersionLabel('')
                setVersionNote('')
                toast.success(`v${result.version.version_no} 저장 완료`)
            } else {
                toast.error(result.error || '버전 저장에 실패했습니다')
            }
        } catch (err) {
            console.error(err)
            toast.error('예기치 못한 오류가 발생했습니다')
        } finally {
            setIsSavingVersion(false)
        }
    }

    // 스냅샷 그대로 PDF 생성 — 현재 아카이브 상태를 전혀 참조하지 않는다.
    const handleDownloadSnapshot = async (version: ResumeVersion) => {
        setBusyVersionId(version.id)
        try {
            const snapshot = version.snapshot as ResumeData
            const name = snapshot?.name || '이력서'
            await downloadPdf(snapshot, `${name}_이력서_v${version.version_no}_${dateStamp(version.created_at)}.pdf`)
            toast.success(`v${version.version_no} PDF가 다운로드되었습니다`)
        } catch (err) {
            console.error('Snapshot PDF error:', err)
            toast.error('스냅샷 PDF 생성에 실패했습니다')
        } finally {
            setBusyVersionId(null)
        }
    }

    // 저장된 선택 조합을 최신 아카이브 위에 복원 (삭제된 항목 id는 조용히 걸러진다)
    const handleRestoreSelections = (version: ResumeVersion) => {
        setSelections(sanitizeSelections(version.selections as Partial<ResumeSelections>, data))
        toast.success(`v${version.version_no} 구성을 불러왔습니다 (현재 데이터 기준)`)
    }

    const handleDeleteVersion = async (version: ResumeVersion) => {
        if (!confirm(`v${version.version_no}${version.label ? ` "${version.label}"` : ''} 버전을 삭제하시겠습니까?`)) return

        setBusyVersionId(version.id)
        try {
            const result = await deleteVersion(version.id)
            if (result.success) {
                setVersions(prev => prev.filter(v => v.id !== version.id))
                toast.success('버전이 삭제되었습니다')
            } else {
                toast.error(result.error || '삭제에 실패했습니다')
            }
        } finally {
            setBusyVersionId(null)
        }
    }

    const inputClass = 'bg-stone-900 border border-stone-700 rounded p-2 text-sm text-stone-200 focus:border-green-500 outline-none'

    return (
        <div className="flex flex-col gap-6">
            {/* 상단 바: 버전 저장 + export */}
            <div className="flex flex-wrap items-center gap-3 bg-surface border border-stone-800 rounded-xl p-4">
                <div className="flex items-center gap-2 flex-wrap flex-1">
                    <i className="fa-solid fa-code-branch text-stone-500"></i>
                    <input
                        type="text"
                        value={versionLabel}
                        onChange={e => setVersionLabel(e.target.value)}
                        placeholder='라벨 (예: "백엔드 신입 지원용")'
                        className={`${inputClass} flex-1 min-w-48`}
                    />
                    <input
                        type="text"
                        value={versionNote}
                        onChange={e => setVersionNote(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveVersion() }}
                        placeholder="메모 (제출처 등)"
                        className={`${inputClass} flex-1 min-w-40`}
                    />
                    <button
                        onClick={handleSaveVersion}
                        disabled={isSavingVersion}
                        className="text-sm px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white font-bold rounded disabled:opacity-50 whitespace-nowrap"
                    >
                        {isSavingVersion
                            ? <i className="fa-solid fa-spinner fa-spin"></i>
                            : `현재 상태를 v${nextVersionNo}로 저장`}
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

            {/* 버전 이력 */}
            <details open={versions.length > 0} className="bg-surface border border-stone-800 rounded-xl">
                <summary className="cursor-pointer select-none px-4 py-3 font-bold text-sm text-stone-300">
                    <i className="fa-solid fa-clock-rotate-left text-stone-500 mr-2"></i>
                    버전 이력
                    <span className="text-stone-600 font-normal ml-2">{versions.length}</span>
                </summary>

                <div className="px-4 pb-4">
                    {versions.length === 0 ? (
                        <p className="text-xs text-stone-600">
                            저장된 버전이 없습니다. 위에서 “현재 상태를 v1로 저장”을 누르면 지금 구성이 그대로 보관됩니다.
                        </p>
                    ) : (
                        <>
                            <p className="text-[11px] text-stone-600 mb-3">
                                <i className="fa-solid fa-lock mr-1"></i>
                                각 버전은 저장 시점의 내용을 그대로 동결합니다. 아카이브를 나중에 수정해도
                                <strong className="text-stone-500"> 스냅샷 PDF</strong>는 변하지 않습니다.
                            </p>
                            <div className="space-y-2">
                                {versions.map(version => (
                                    <div
                                        key={version.id}
                                        className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-stone-900 border border-stone-800"
                                    >
                                        <span className="font-bold text-green-500 text-sm shrink-0">v{version.version_no}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-stone-200 truncate">
                                                {version.label || <span className="text-stone-600">(라벨 없음)</span>}
                                            </p>
                                            <p className="text-[11px] text-stone-600 truncate">
                                                {formatDateTime(version.created_at)}
                                                {version.note && ` · ${version.note}`}
                                            </p>
                                        </div>

                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => handleDownloadSnapshot(version)}
                                                disabled={busyVersionId === version.id}
                                                className="text-xs px-3 py-1.5 bg-green-600/15 hover:bg-green-600/30 text-green-500 rounded border border-green-600/30 disabled:opacity-50"
                                                title="저장 당시 내용 그대로 PDF 생성"
                                            >
                                                {busyVersionId === version.id
                                                    ? <i className="fa-solid fa-spinner fa-spin"></i>
                                                    : <><i className="fa-solid fa-file-pdf mr-1"></i>스냅샷 PDF</>}
                                            </button>
                                            <button
                                                onClick={() => handleRestoreSelections(version)}
                                                className="text-xs px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-700"
                                                title="이 버전의 항목 구성을 현재 데이터 위에 복원"
                                            >
                                                <i className="fa-solid fa-rotate-left mr-1"></i>이 설정으로 편집
                                            </button>
                                            <button
                                                onClick={() => handleDeleteVersion(version)}
                                                disabled={busyVersionId === version.id}
                                                className="text-xs px-3 py-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded border border-red-900/30 disabled:opacity-50"
                                            >
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </details>

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
