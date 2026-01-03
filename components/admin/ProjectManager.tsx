'use client'

import { useState, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { addProject, updateProject, deleteProject, fetchGithubRepo } from '@/app/actions'
import { Project } from '@/types/database.types'

interface ProjectManagerProps {
    initialProjects: Project[]
}

export default function ProjectManager({ initialProjects }: ProjectManagerProps) {
    const [projects] = useState<Project[]>(initialProjects)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isFetching, setIsFetching] = useState(false)

    // Form State for Controlled Inputs
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        stack: '',
        github_link: '',
        content: ''
    })

    // Update form when editingId changes
    useEffect(() => {
        if (editingId) {
            const project = projects.find(p => p.id === editingId)
            if (project) {
                setFormData({
                    title: project.title,
                    description: project.description,
                    date: project.date,
                    stack: project.stack.join(', '),
                    github_link: project.github_link || '',
                    content: project.content || ''
                })
            }
        } else {
            // Reset form for new project
            setFormData({
                title: '',
                description: '',
                date: '',
                stack: '',
                github_link: '',
                content: ''
            })
        }
    }, [editingId, projects])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleFetchGithub = async () => {
        const url = formData.github_link.trim()
        if (!url) {
            toast.error('Please enter a GitHub URL first')
            return
        }

        setIsFetching(true)
        try {
            console.log('Calling fetchGithubRepo with:', url);
            const result = await fetchGithubRepo(url);
            console.log('Fetch result:', result);

            if (!result.success || !result.data) {
                console.error('Fetch failed:', result.error);
                throw new Error(result.error || 'Failed to fetch');
            }

            const data = result.data;
            console.log('Setting form data with:', data);

            // Auto-fill form
            setFormData(prev => ({
                ...prev,
                title: data.title,
                description: data.description,
                date: data.date,
                content: data.content
            }))

            toast.success('Fetched data from GitHub!')

        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Failed to fetch from GitHub.')
        } finally {
            setIsFetching(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const submitData = new FormData()

        // Append all controlled state to FormData
        Object.entries(formData).forEach(([key, value]) => {
            submitData.append(key, value)
        })

        // Rename description field to match action expectation if necessary
        // The action expects 'desc', but state is 'description'. 
        // Let's ensure we send what the action expects.
        if (formData.description) {
            submitData.append('desc', formData.description)
        }

        // Determine which action to run
        const action = editingId ? updateProject : addProject

        if (editingId) {
            submitData.append('id', editingId)
        }

        const result = await action(submitData)

        if (!result.success) {
            toast.error('Operation failed')
        } else {
            toast.success(editingId ? 'Project updated!' : 'Project added!')
            window.location.reload()
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return;

        const result = await deleteProject(id)
        if (result.success) {
            toast.success('Project deleted')
            window.location.reload()
        } else {
            toast.error('Failed to delete')
        }
    }

    return (
        <div className="grid lg:grid-cols-2 gap-12">
            {/* Form Section */}
            <section className="bg-surface p-8 rounded-2xl border border-stone-800 h-fit sticky top-10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <i className={`fa-solid ${editingId ? 'fa-pen-to-square' : 'fa-plus-circle'} text-stone-500`}></i>
                        {editingId ? 'Edit Project' : 'Add New Project'}
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
                    {/* GitHub Link First */}
                    <div className="relative">
                        <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">GitHub Link (Auto-fill)</label>
                        <div className="flex gap-2">
                            <input
                                name="github_link"
                                type="text"
                                placeholder="https://github.com/username/repo"
                                value={formData.github_link}
                                onChange={handleInputChange}
                                className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-khaki-500 outline-none"
                            />
                            <button
                                type="button"
                                onClick={handleFetchGithub}
                                disabled={isFetching || !formData.github_link}
                                className="px-4 py-2 bg-stone-800 text-stone-300 rounded border border-stone-700 hover:bg-stone-700 hover:text-white disabled:opacity-50 text-xs font-bold whitespace-nowrap"
                            >
                                {isFetching ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Fetch Data'}
                            </button>
                        </div>
                        <p className="text-[10px] text-stone-600 mt-1">Enter a GitHub repository URL to auto-fill details.</p>
                    </div>

                    <div className="border-t border-stone-800 pt-4 space-y-4">
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Project Title</label>
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
                            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Description</label>
                            <textarea
                                name="description"
                                required
                                rows={3}
                                value={formData.description}
                                onChange={handleInputChange}
                                className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-khaki-500 outline-none"
                            ></textarea>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Date</label>
                                <input
                                    name="date"
                                    type="text"
                                    placeholder="2025.01"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-khaki-500 outline-none"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Stack (CSV)</label>
                                <input
                                    name="stack"
                                    type="text"
                                    placeholder="React, Node.js"
                                    value={formData.stack}
                                    onChange={handleInputChange}
                                    className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-khaki-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Detailed Content (Markdown)</label>
                            <textarea
                                name="content"
                                rows={6}
                                placeholder="# Project Details\n\nExplain your project methodology..."
                                value={formData.content}
                                onChange={handleInputChange}
                                className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-khaki-500 outline-none font-mono text-sm"
                            ></textarea>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={`w-full font-bold py-3 rounded transition-colors mt-2 ${editingId ? 'bg-khaki-600 hover:bg-khaki-500 text-black' : 'bg-stone-700 hover:bg-stone-600 text-white'}`}
                    >
                        {editingId ? 'Update Project' : 'Add Project'}
                    </button>
                </form>
            </section>

            {/* List Section */}
            <section className="bg-surface/50 p-8 rounded-2xl border border-stone-800/50">
                <h2 className="text-xl font-bold mb-6 text-stone-400">Existing Projects ({projects.length})</h2>
                <div className="space-y-4">
                    {projects.map((project) => (
                        <div key={project.id} className={`p-4 rounded-lg border flex justify-between items-start transition-all ${editingId === project.id ? 'bg-khaki-500/10 border-khaki-500' : 'bg-stone-900 border-stone-800 hover:border-stone-600'}`}>
                            <div>
                                <h3 className={`font-bold ${editingId === project.id ? 'text-khaki-500' : 'text-stone-200'}`}>{project.title}</h3>
                                <p className="text-xs text-stone-500 mb-2">{project.date} | {project.stack?.join(', ')}</p>
                                <p className="text-sm text-stone-400 line-clamp-2">{project.description}</p>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                                <button
                                    onClick={() => setEditingId(project.id)}
                                    className="text-xs px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-700"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(project.id)}
                                    className="text-xs px-3 py-1 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded border border-red-900/30"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}

                    {projects.length === 0 && (
                        <div className="text-center py-10 opacity-50">
                            <p>No projects found.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
