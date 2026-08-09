'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { addCategory, updateCategory, deleteCategory } from '@/app/actions'
import { Category } from '@/types/database.types'
import { postSlug } from '@/utils/post'

interface CategoryManagerProps {
    initialCategories: Category[]
    /** How many posts each category holds, keyed by category id — used in the delete warning. */
    postCounts: Record<string, number>
}

const EMPTY = {
    name: '',
    slug: '',
    sort_order: '0',
}

export default function CategoryManager({ initialCategories, postCounts }: CategoryManagerProps) {
    const [categories] = useState<Category[]>(initialCategories)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({ ...EMPTY })

    // Form population happens on the transition, not in an effect reacting to it.
    // An effect would render once with the stale form, then immediately re-render
    // with the right values — a cascading render for something the click already knows.
    const startEdit = (category: Category) => {
        setEditingId(category.id)
        setFormData({
            name: category.name,
            slug: category.slug,
            sort_order: String(category.sort_order ?? 0),
        })
    }

    const cancelEdit = () => {
        setEditingId(null)
        setFormData({ ...EMPTY })
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const submitData = new FormData()
        submitData.append('name', formData.name)
        submitData.append('slug', formData.slug.trim() || postSlug(formData.name))
        submitData.append('sort_order', formData.sort_order)

        const action = editingId ? updateCategory : addCategory
        if (editingId) submitData.append('id', editingId)

        try {
            const result = await action(submitData)
            if (!result.success) {
                toast.error(result.error || 'Operation failed')
            } else {
                toast.success(editingId ? 'Category updated!' : 'Category added!')
                window.location.reload()
            }
        } catch (err) {
            console.error(err)
            toast.error('An unexpected error occurred')
        }
    }

    const handleDelete = async (id: string, name: string) => {
        const count = postCounts[id] ?? 0
        const warning = count > 0
            ? `Delete "${name}"? ${count} post(s) will become uncategorized.`
            : `Delete "${name}"?`
        if (!confirm(warning)) return

        try {
            const result = await deleteCategory(id)
            if (result.success) {
                toast.success('Category deleted')
                window.location.reload()
            } else {
                toast.error(result.error || 'Failed to delete')
            }
        } catch (err) {
            console.error(err)
            toast.error('An unexpected error occurred deleting')
        }
    }

    return (
        <div className="grid lg:grid-cols-2 gap-12">
            {/* Form Section */}
            <section className="bg-surface p-8 rounded-2xl border border-stone-800 h-fit sticky top-10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <i className={`fa-solid ${editingId ? 'fa-pen-to-square' : 'fa-plus-circle'} text-stone-500`}></i>
                        {editingId ? 'Edit Category' : 'Add New Category'}
                    </h2>
                    {editingId && (
                        <button
                            onClick={cancelEdit}
                            className="text-xs text-red-400 hover:text-red-300 underline"
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Name</label>
                        <input
                            name="name"
                            type="text"
                            required
                            placeholder="개발"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-green-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Slug (URL)</label>
                        <input
                            name="slug"
                            type="text"
                            placeholder="auto from name if empty"
                            value={formData.slug}
                            onChange={handleInputChange}
                            className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-green-500 outline-none font-mono text-sm"
                        />
                        <p className="text-[11px] text-stone-600 mt-1">
                            Used in /blog?category=… — ASCII only. Korean names need a slug typed here.
                        </p>
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Sort Order</label>
                        <input
                            name="sort_order"
                            type="number"
                            value={formData.sort_order}
                            onChange={handleInputChange}
                            className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-green-500 outline-none"
                        />
                        <p className="text-[11px] text-stone-600 mt-1">Lower numbers appear first in the blog filter row.</p>
                    </div>

                    <button
                        type="submit"
                        className={`w-full font-bold py-3 rounded transition-colors mt-2 ${editingId ? 'bg-green-600 hover:bg-green-500 text-black' : 'bg-stone-700 hover:bg-stone-600 text-white'}`}
                    >
                        {editingId ? 'Update Category' : 'Add Category'}
                    </button>
                </form>
            </section>

            {/* List Section */}
            <section className="bg-surface/50 p-8 rounded-2xl border border-stone-800/50">
                <h2 className="text-xl font-bold mb-6 text-stone-400">Existing Categories ({categories.length})</h2>
                <div className="space-y-4">
                    {categories.map((category) => (
                        <div key={category.id} className={`p-4 rounded-lg border flex justify-between items-start transition-all ${editingId === category.id ? 'bg-green-500/10 border-green-500' : 'bg-stone-900 border-stone-800 hover:border-stone-600'}`}>
                            <div className="min-w-0">
                                <h3 className={`font-bold ${editingId === category.id ? 'text-green-500' : 'text-stone-200'}`}>
                                    {category.name}
                                </h3>
                                <p className="text-xs text-stone-500 font-mono">
                                    ?category={category.slug} · order {category.sort_order} · {postCounts[category.id] ?? 0} post(s)
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 ml-4 shrink-0">
                                <button
                                    onClick={() => startEdit(category)}
                                    className="text-xs px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-700"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(category.id, category.name)}
                                    className="text-xs px-3 py-1 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded border border-red-900/30"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}

                    {categories.length === 0 && (
                        <div className="text-center py-10 opacity-50">
                            <p>No categories found.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
