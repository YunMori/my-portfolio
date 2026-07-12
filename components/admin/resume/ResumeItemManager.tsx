'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
    DndContext, closestCenter, PointerSensor, useSensor, useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
    addResumeItem, updateResumeItem, deleteResumeItem,
    reorderResumeItems, toggleResumeItemFlag,
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

// 폼 상태 초기값: 모든 필드 빈 문자열 + 메타 기본값
function emptyForm(category: ResumeCategory) {
    const form: Record<string, string> = {}
    category.fields.forEach(f => { form[f.name] = '' })
    form.tags = ''
    form.is_public = category.sensitive ? '' : 'on'
    form.include_in_resume_default = category.sensitive ? '' : 'on'
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
    form.tags = Array.isArray(item.tags) ? item.tags.join(', ') : ''
    form.is_public = item.is_public ? 'on' : ''
    form.include_in_resume_default = item.include_in_resume_default ? 'on' : ''
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
    const [items, setItems] = useState<ResumeItem[]>(initialItems)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState<Record<string, string>>(() => emptyForm(category))
    const [isSaving, setIsSaving] = useState(false)

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

    useEffect(() => {
        if (editingId) {
            const item = items.find(i => i.id === editingId)
            if (item) setFormData(itemToForm(category, item))
        } else {
            setFormData(emptyForm(category))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingId])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        const checked = (e.target as HTMLInputElement).checked
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (checked ? 'on' : '') : value }))
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
                window.location.reload()
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
                if (editingId === id) setEditingId(null)
            } else {
                toast.error(result.error || '삭제에 실패했습니다')
            }
        } catch (err) {
            console.error(err)
            toast.error('예기치 못한 오류가 발생했습니다')
        }
    }

    // 드래그 정렬: 낙관적 반영 후 서버 저장
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = items.findIndex(i => i.id === active.id)
        const newIndex = items.findIndex(i => i.id === over.id)
        const reordered = arrayMove(items, oldIndex, newIndex)
        setItems(reordered)

        const result = await reorderResumeItems(category.key, reordered.map(i => i.id))
        if (!result.success) {
            toast.error(result.error || '순서 저장에 실패했습니다')
            setItems(items) // 롤백
        }
    }

    // 인라인 토글: 낙관적 반영 후 서버 저장
    const handleToggle = async (id: string, flag: 'is_public' | 'include_in_resume_default', value: boolean) => {
        setItems(prev => prev.map(i => (i.id === id ? { ...i, [flag]: value } : i)))
        const result = await toggleResumeItemFlag(category.key, id, flag, value)
        if (!result.success) {
            toast.error(result.error || '변경에 실패했습니다')
            setItems(prev => prev.map(i => (i.id === id ? { ...i, [flag]: !value } : i)))
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
                        <button onClick={() => setEditingId(null)} className="text-xs text-red-400 hover:text-red-300 underline">
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

                    {/* 공통 메타 필드 */}
                    <div className="border-t border-stone-800 pt-4 space-y-4">
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">태그 (쉼표 구분 — 직무/용도 필터링)</label>
                            <input
                                name="tags" type="text" placeholder="백엔드, AI, SSAFY"
                                value={formData.tags ?? ''} onChange={handleInputChange}
                                className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-green-500 outline-none"
                            />
                        </div>
                        <div className="flex gap-6 text-sm text-stone-400">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    name="is_public" type="checkbox"
                                    checked={formData.is_public === 'on'} onChange={handleInputChange}
                                    className="accent-green-500"
                                />
                                웹 포트폴리오 공개
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    name="include_in_resume_default" type="checkbox"
                                    checked={formData.include_in_resume_default === 'on'} onChange={handleInputChange}
                                    className="accent-green-500"
                                />
                                이력서 기본 포함
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit" disabled={isSaving}
                        className={`w-full font-bold py-3 rounded transition-colors mt-2 disabled:opacity-50 ${editingId ? 'bg-green-600 hover:bg-green-500 text-black' : 'bg-stone-700 hover:bg-stone-600 text-white'}`}
                    >
                        {isSaving ? <i className="fa-solid fa-spinner fa-spin"></i> : (editingId ? '수정 저장' : '항목 추가')}
                    </button>
                </form>
            </section>

            {/* 리스트 (드래그 정렬) */}
            <section className="bg-surface/50 p-8 rounded-2xl border border-stone-800/50">
                <h2 className="text-xl font-bold mb-2 text-stone-400">등록된 항목 ({items.length})</h2>
                <p className="text-xs text-stone-600 mb-6"><i className="fa-solid fa-grip-vertical mr-1"></i> 드래그하여 순서를 조정할 수 있습니다.</p>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                            {items.map(item => (
                                <SortableRow
                                    key={item.id}
                                    item={item}
                                    category={category}
                                    isEditing={editingId === item.id}
                                    onEdit={() => setEditingId(item.id)}
                                    onDelete={() => handleDelete(item.id)}
                                    onToggle={handleToggle}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                {items.length === 0 && (
                    <div className="text-center py-10 opacity-50">
                        <p>등록된 항목이 없습니다.</p>
                    </div>
                )}
            </section>
        </div>
    )
}

// 드래그 가능한 리스트 행
function SortableRow({ item, category, isEditing, onEdit, onDelete, onToggle }: {
    item: ResumeItem
    category: ResumeCategory
    isEditing: boolean
    onEdit: () => void
    onDelete: () => void
    onToggle: (id: string, flag: 'is_public' | 'include_in_resume_default', value: boolean) => void
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    const title = (item[category.titleField] as string) || '(제목 없음)'

    return (
        <div
            ref={setNodeRef} style={style}
            className={`p-4 rounded-lg border flex gap-3 items-start transition-colors ${isEditing ? 'bg-green-500/10 border-green-500' : 'bg-stone-900 border-stone-800 hover:border-stone-600'}`}
        >
            <button
                {...attributes} {...listeners}
                className="mt-1 text-stone-600 hover:text-stone-400 cursor-grab active:cursor-grabbing touch-none"
                aria-label="드래그하여 순서 변경"
            >
                <i className="fa-solid fa-grip-vertical"></i>
            </button>

            <div className="flex-1 min-w-0">
                <h3 className={`font-bold truncate ${isEditing ? 'text-green-500' : 'text-stone-200'}`}>{title}</h3>
                <p className="text-xs text-stone-500 mb-2 truncate">{subtitle(category, item)}</p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-500">
                    <label className="flex items-center gap-1 cursor-pointer hover:text-stone-300">
                        <input
                            type="checkbox" checked={!!item.is_public}
                            onChange={e => onToggle(item.id, 'is_public', e.target.checked)}
                            className="accent-green-500"
                        />
                        공개
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer hover:text-stone-300">
                        <input
                            type="checkbox" checked={!!item.include_in_resume_default}
                            onChange={e => onToggle(item.id, 'include_in_resume_default', e.target.checked)}
                            className="accent-green-500"
                        />
                        이력서 기본 포함
                    </label>
                    {Array.isArray(item.tags) && item.tags.length > 0 && (
                        <span className="flex flex-wrap gap-1">
                            {item.tags.map(tag => (
                                <span key={tag} className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-400">#{tag}</span>
                            ))}
                        </span>
                    )}
                </div>
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
