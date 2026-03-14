'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { addBlogPost, updateBlogPost, deleteBlogPost } from '@/app/actions'
import { BlogPost } from '@/types/database.types'

interface BlogManagerProps {
    initialPosts: BlogPost[]
}

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
}

export default function BlogManager({ initialPosts }: BlogManagerProps) {
    const [posts] = useState<BlogPost[]>(initialPosts)
    const [editingId, setEditingId] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        description: '',
        content: '',
        tags: '',
        published_at: new Date().toISOString().slice(0, 10)
    })

    useEffect(() => {
        if (editingId) {
            const post = posts.find(p => p.id === editingId)
            if (post) {
                setFormData({
                    title: post.title,
                    slug: post.slug,
                    description: post.description,
                    content: post.content,
                    tags: post.tags?.join(', ') || '',
                    published_at: post.published_at.slice(0, 10)
                })
            }
        } else {
            setFormData({
                title: '',
                slug: '',
                description: '',
                content: '',
                tags: '',
                published_at: new Date().toISOString().slice(0, 10)
            })
        }
    }, [editingId, posts])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => {
            const updated = { ...prev, [name]: value }
            // Auto-generate slug from title if slug is empty or was auto-generated
            if (name === 'title' && (!prev.slug || prev.slug === generateSlug(prev.title))) {
                updated.slug = generateSlug(value)
            }
            return updated
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const submitData = new FormData()
        Object.entries(formData).forEach(([key, value]) => submitData.append(key, value))
        if (editingId) submitData.append('id', editingId)

        const action = editingId ? updateBlogPost : addBlogPost

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
            const result = await deleteBlogPost(id)
            if (result.success) {
                toast.success('Post deleted')
                window.location.reload()
            } else {
                toast.error(result.error || 'Failed to delete')
            }
        } catch (err) {
            console.error(err)
            toast.error('An unexpected error occurred')
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
                        <button onClick={() => setEditingId(null)} className="text-xs text-red-400 hover:text-red-300 underline">
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
                            className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-khaki-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Slug (URL)</label>
                        <input
                            name="slug"
                            type="text"
                            required
                            value={formData.slug}
                            onChange={handleInputChange}
                            className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-khaki-500 outline-none font-mono text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Description</label>
                        <textarea
                            name="description"
                            rows={2}
                            required
                            value={formData.description}
                            onChange={handleInputChange}
                            className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-khaki-500 outline-none"
                        ></textarea>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Published At</label>
                            <input
                                name="published_at"
                                type="date"
                                value={formData.published_at}
                                onChange={handleInputChange}
                                className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-khaki-500 outline-none"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Tags (CSV)</label>
                            <input
                                name="tags"
                                type="text"
                                placeholder="React, TypeScript"
                                value={formData.tags}
                                onChange={handleInputChange}
                                className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-khaki-500 outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Content (Markdown)</label>
                        <textarea
                            name="content"
                            rows={10}
                            placeholder="# My Blog Post&#10;&#10;Write your content here..."
                            value={formData.content}
                            onChange={handleInputChange}
                            className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-khaki-500 outline-none font-mono text-sm"
                        ></textarea>
                    </div>
                    <button
                        type="submit"
                        className={`w-full font-bold py-3 rounded transition-colors mt-2 ${editingId ? 'bg-khaki-600 hover:bg-khaki-500 text-black' : 'bg-stone-700 hover:bg-stone-600 text-white'}`}
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
                        <div
                            key={post.id}
                            className={`p-4 rounded-lg border flex justify-between items-start transition-all ${editingId === post.id ? 'bg-khaki-500/10 border-khaki-500' : 'bg-stone-900 border-stone-800 hover:border-stone-600'}`}
                        >
                            <div className="flex-1 min-w-0">
                                <h3 className={`font-bold truncate ${editingId === post.id ? 'text-khaki-500' : 'text-stone-200'}`}>{post.title}</h3>
                                <p className="text-xs text-stone-500 mb-1">{new Date(post.published_at).toLocaleDateString('ko-KR')} | {post.tags?.join(', ')}</p>
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
                            <p>No blog posts found.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
