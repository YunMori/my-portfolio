'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
    addResumeItem, updateResumeItem, deleteResumeItem,
} from '@/app/actions/resume'
import { ResumeCategory, FieldDef } from '@/utils/resume/config'
import { ResumeMeta } from '@/types/database.types'

// 카테고리 무관 제네릭 레코드 (공통 메타 + 카테고리별 컬럼)
type ResumeItem = ResumeMeta & Record<string, unknown>

interface ResumeItemManagerProps {
    category: ResumeCategory
    initialItems: ResumeItem[]
    projectOptions?: { id: string; title: string }[]  // field type 'project' 용
}

// 폼 상태 초기값: 카테고리 입력 필드만 관리한다.
function emptyForm(category: ResumeCategory) {
    const form: Record<string, string> = {}
    category.fields.forEach(f => { form[f.name] = '' })
    return form
}

// 편집 시작 시 레코드 → 폼 상태 변환
function itemToForm(category: ResumeCategory, item: ResumeItem) {
    const form: Record<string, string> = {}
    category.fields.forEach(f => {
        const value = item[f.name]
        if (f.type === 'bullets') {
            form[f.name] = Array.isArray(value) ? value.join('\n') : ''
        } else {
            form[f.name] = value == null ? '' : String(value)
        }
    })
    return form
}

// 리스트 행 부제 텍스트
function subtitle(category: ResumeCategory, item: ResumeItem) {
    return category.subtitleFields
        .map(f => item[f])
        .filter(v => v != null && v !== '')
        .join(' | ')
}

export default function ResumeItemManager({ category, initialItems, projectOptions = [] }: ResumeItemManagerProps) {
    const router = useRouter()

    // 삭제 후 목록을 갱신하기 위해 로컬 state로 관리한다.
    // 다만 router.refresh()로 새 initialItems가 내려오면 그쪽이 진실이므로 렌더 중에
    // 맞춰준다 (useState 초기화자는 마운트 때 한 번만 돌기 때문에 이 동기화가 없으면
    // 저장 후 목록이 갱신되지 않는다).
    const [items, setItems] = useState<ResumeItem[]>(initialItems)
    const [syncedItems, setSyncedItems] = useState(initialItems)
    if (initialItems !== syncedItems) {
        setSyncedItems(initialItems)
        setItems(initialItems)
    }

    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState<Record<string, string>>(() => emptyForm(category))
    const [isSaving, setIsSaving] = useState(false)

    // 폼 채우기는 클릭 시점에 한다. 이펙트로 하면 stale한 값으로 한 번 렌더한 뒤
    // 올바른 값으로 다시 렌더하게 되고, 의존성 배열도 억지로 눌러야 했다.
    const startEdit = (item: ResumeItem) => {
        setEditingId(item.id)
        setFormData(itemToForm(category, item))
    }

    const cancelEdit = () => {
        setEditingId(null)
        setFormData(emptyForm(category))
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        const submitData = new FormData()
        Object.entries(formData).forEach(([key, value]) => submitData.append(key, value))
        if (editingId) submitData.append('id', editingId)

        try {
            const action = editingId
                ? updateResumeItem.bind(null, category.key)
                : addResumeItem.bind(null, category.key)
            const result = await action(submitData)

            if (!result.success) {
                toast.error(result.error || '저장에 실패했습니다')
            } else {
                toast.success(editingId ? '수정되었습니다' : '추가되었습니다')
                cancelEdit()
                router.refresh()
            }
        } catch (err) {
            console.error(err)
            toast.error('예기치 못한 오류가 발생했습니다')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return

        try {
            const result = await deleteResumeItem(category.key, id)
            if (result.success) {
                toast.success('삭제되었습니다')
                setItems(prev => prev.filter(i => i.id !== id))
                if (editingId === id) cancelEdit()
            } else {
                toast.error(result.error || '삭제에 실패했습니다')
            }
        } catch (err) {
            console.error(err)
            toast.error('예기치 못한 오류가 발생했습니다')
        }
    }

    const renderField = (field: FieldDef) => {
        const common = {
            name: field.name,
            value: formData[field.name] ?? '',
            onChange: handleInputChange,
            required: field.required,
            className: 'w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-green-500 outline-none',
        }

        switch (field.type) {
            case 'textarea':
            case 'bullets':
                return <textarea {...common} rows={field.type === 'bullets' ? 4 : 5} placeholder={field.placeholder} className={`${common.className} text-sm`} />
            case 'select':
                return (
                    <select {...common}>
                        <option value="">선택...</option>
                        {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                )
            case 'project':
                return (
                    <select {...common}>
                        <option value="">프로젝트 선택...</option>
                        {projectOptions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                )
            case 'number':
                return <input {...common} type="number" placeholder={field.placeholder} />
            case 'date':
                return <input {...common} type="date" />
            default:
                return <input {...common} type="text" placeholder={field.placeholder} />
        }
    }

    return (
        <div className="grid lg:grid-cols-2 gap-12">
            {/* 입력 폼 */}
            <section className="bg-surface p-8 rounded-2xl border border-stone-800 h-fit sticky top-10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <i className={`fa-solid ${editingId ? 'fa-pen-to-square' : 'fa-plus-circle'} text-stone-500`}></i>
                        {editingId ? `${category.labelKo} 수정` : `${category.labelKo} 추가`}
                    </h2>
                    {editingId && (
                        <button onClick={cancelEdit} className="text-xs text-red-400 hover:text-red-300 underline">
                            편집 취소
                        </button>
                    )}
                </div>

                {category.sensitive && (
                    <p className="mb-4 text-xs text-amber-500/80 bg-amber-500/10 border border-amber-500/20 rounded p-3">
                        <i className="fa-solid fa-lock mr-1"></i> 비공개 데이터 — 이 카테고리는 로그인한 본인만 조회할 수 있습니다.
                    </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {category.fields.map(field => (
                        <div key={field.name}>
                            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">
                                {field.label}{field.required && <span className="text-red-400 ml-1">*</span>}
                            </label>
                            {renderField(field)}
                        </div>
                    ))}

                    <button
                        type="submit" disabled={isSaving}
                        className={`w-full font-bold py-3 rounded transition-colors mt-2 disabled:opacity-50 ${editingId ? 'bg-green-600 hover:bg-green-500 text-black' : 'bg-stone-700 hover:bg-stone-600 text-white'}`}
                    >
                        {isSaving ? <i className="fa-solid fa-spinner fa-spin"></i> : (editingId ? '수정 저장' : '항목 추가')}
                    </button>
                </form>
            </section>

            {/* 자료 목록 */}
            <section className="bg-surface/50 p-8 rounded-2xl border border-stone-800/50">
                <h2 className="text-xl font-bold mb-6 text-stone-400">등록된 항목 ({items.length})</h2>
                <div className="space-y-4">
                    {items.map(item => (
                        <ArchiveRow
                            key={item.id}
                            item={item}
                            category={category}
                            isEditing={editingId === item.id}
                            onEdit={() => startEdit(item)}
                            onDelete={() => handleDelete(item.id)}
                        />
                    ))}
                </div>

                {items.length === 0 && (
                    <div className="text-center py-10 opacity-50">
                        <p>등록된 항목이 없습니다.</p>
                    </div>
                )}
            </section>
        </div>
    )
}

// 자료 편집과 삭제만 제공하는 목록 행
function ArchiveRow({ item, category, isEditing, onEdit, onDelete }: {
    item: ResumeItem
    category: ResumeCategory
    isEditing: boolean
    onEdit: () => void
    onDelete: () => void
}) {
    const title = (item[category.titleField] as string) || '(제목 없음)'

    return (
        <div
            className={`p-4 rounded-lg border flex gap-3 items-start transition-colors ${isEditing ? 'bg-green-500/10 border-green-500' : 'bg-stone-900 border-stone-800 hover:border-stone-600'}`}
        >
            <div className="flex-1 min-w-0">
                <h3 className={`font-bold truncate ${isEditing ? 'text-green-500' : 'text-stone-200'}`}>{title}</h3>
                <p className="text-xs text-stone-500 mb-2 truncate">{subtitle(category, item)}</p>

            </div>

            <div className="flex flex-col gap-2 ml-2 shrink-0">
                <button onClick={onEdit} className="text-xs px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-700">
                    수정
                </button>
                <button onClick={onDelete} className="text-xs px-3 py-1 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded border border-red-900/30">
                    삭제
                </button>
            </div>
        </div>
    )
}
