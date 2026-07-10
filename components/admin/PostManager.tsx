'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { addPost, updatePost, deletePost } from '@/app/actions'
import { Post } from '@/types/database.types'
import { slugify } from '@/utils/post'

interface PostManagerProps {
    initialPosts: Post[]
}

const EMPTY = {
    title: '',
    slug: '',
    description: '',
    date: '',
    tags: '',
    content: '',
    published: true,
}

export default function PostManager({ initialPosts }: PostManagerProps) {
    const [posts] = useState<Post[]>(initialPosts)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({ ...EMPTY })

    useEffect(() => {
        if (editingId) {
            const post = posts.find(p => p.id === editingId)
            if (post) {
                setFormData({
                    title: post.title,
                    slug: post.slug,
                    description: post.description || '',
                    date: post.date || '',
                    tags: (post.tags ?? []).join(', '),
                    content: post.content || '',
                    published: post.published,
                })
            }
        } else {
            setFormData({ ...EMPTY })
        }
    }, [editingId, posts])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        const checked = (e.target as HTMLInputElement).checked
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const submitData = new FormData()
        submitData.append('title', formData.title)
        submitData.append('slug', formData.slug.trim() || slugify(formData.title))
        submitData.append('description', formData.description)
        submitData.append('date', formData.date)
        submitData.append('tags', formData.tags)
        submitData.append('content', formData.content)
        submitData.append('published', formData.published ? 'true' : 'false')

        const action = editingId ? updatePost : addPost
        if (editingId) submitData.append('id', editingId)

        try {
            const result = await action(submitData)
            if (!result.success) {
                toast.error(result.error || 'Operation failed')
            } else {
                toast.success(editingId ? 'Post updated!' : 'Post added!')
                window.location.reload()
            }
        } catch (err) {
            console.error(err)
            toast.error('An unexpected error occurred')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return

        try {
            const result = await deletePost(id)
            if (result.success) {
                toast.success('Post deleted')
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
                        {editingId ? 'Edit Post' : 'Add New Post'}
                    </h2>
                    {editingId && (
                        <button
                            onClick={() => setEditingId(null)}
                            className="text-xs text-red-400 hover:text-red-300 underline"
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Title</label>
                        <input
                            name="title"
                            type="text"
                            required
                            value={formData.title}
                            onChange={handleInputChange}
                            className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-green-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Slug (URL)</label>
                        <input
                            name="slug"
                            type="text"
                            placeholder="auto from title if empty"
                            value={formData.slug}
                            onChange={handleInputChange}
                            className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-green-500 outline-none font-mono text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Description</label>
                        <input
                            name="description"
                            type="text"
                            placeholder="Short summary shown in the list"
                            value={formData.description}
                            onChange={handleInputChange}
                            className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-green-500 outline-none"
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Date</label>
                            <input
                                name="date"
                                type="text"
                                placeholder="2026.07.10"
                                value={formData.date}
                                onChange={handleInputChange}
                                className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-green-500 outline-none"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Tags (CSV)</label>
                            <input
                                name="tags"
                                type="text"
                                placeholder="Next.js, 회고"
                                value={formData.tags}
                                onChange={handleInputChange}
                                className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-green-500 outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Content (Markdown)</label>
                        <textarea
                            name="content"
                            rows={12}
                            placeholder={"## 섹션 제목\n\n본문을 마크다운으로 작성하세요..."}
                            value={formData.content}
                            onChange={handleInputChange}
                            className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-green-500 outline-none font-mono text-sm"
                        ></textarea>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-stone-300 cursor-pointer">
                        <input
                            name="published"
                            type="checkbox"
                            checked={formData.published}
                            onChange={handleInputChange}
                            className="accent-green-500 w-4 h-4"
                        />
                        Published (uncheck to save as draft)
                    </label>

                    <button
                        type="submit"
                        className={`w-full font-bold py-3 rounded transition-colors mt-2 ${editingId ? 'bg-green-600 hover:bg-green-500 text-black' : 'bg-stone-700 hover:bg-stone-600 text-white'}`}
                    >
                        {editingId ? 'Update Post' : 'Add Post'}
                    </button>
                </form>
            </section>

            {/* List Section */}
            <section className="bg-surface/50 p-8 rounded-2xl border border-stone-800/50">
                <h2 className="text-xl font-bold mb-6 text-stone-400">Existing Posts ({posts.length})</h2>
                <div className="space-y-4">
                    {posts.map((post) => (
                        <div key={post.id} className={`p-4 rounded-lg border flex justify-between items-start transition-all ${editingId === post.id ? 'bg-green-500/10 border-green-500' : 'bg-stone-900 border-stone-800 hover:border-stone-600'}`}>
                            <div className="min-w-0">
                                <h3 className={`font-bold ${editingId === post.id ? 'text-green-500' : 'text-stone-200'}`}>
                                    {post.title}
                                    {!post.published && <span className="ml-2 text-[10px] font-mono uppercase text-amber-400 border border-amber-500/40 rounded px-1.5 py-0.5">draft</span>}
                                </h3>
                                <p className="text-xs text-stone-500 mb-2 font-mono">/{post.slug} · {post.date} · {(post.tags ?? []).join(', ')}</p>
                                <p className="text-sm text-stone-400 line-clamp-2">{post.description}</p>
                            </div>
                            <div className="flex flex-col gap-2 ml-4 shrink-0">
                                <button
                                    onClick={() => setEditingId(post.id)}
                                    className="text-xs px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-700"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(post.id)}
                                    className="text-xs px-3 py-1 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded border border-red-900/30"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}

                    {posts.length === 0 && (
                        <div className="text-center py-10 opacity-50">
                            <p>No posts found.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
