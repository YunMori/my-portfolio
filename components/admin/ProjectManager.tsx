'use client'

import { useState } from 'react'
import { addProject, updateProject, deleteProject } from '@/app/actions'
import { Project } from '@/types/database.types'

interface ProjectManagerProps {
    initialProjects: Project[]
}

export default function ProjectManager({ initialProjects }: ProjectManagerProps) {
    const [projects] = useState<Project[]>(initialProjects)
    const [editingId, setEditingId] = useState<string | null>(null)

    // Find the project currently being edited
    const editingProject = projects.find(p => p.id === editingId)

    const handleSubmit = async (formData: FormData) => {
        // Determine which action to run
        const action = editingId ? updateProject : addProject

        // If editing, append the ID to formData so the server knows which one to update
        if (editingId) {
            formData.append('id', editingId)
        }

        const result = await action(formData)

        if (!result.success) {
            alert('Operation failed')
        } else {
            alert(editingId ? 'Project updated!' : 'Project added!')
            if (!editingId) {
                // Reset form or handle simple UI update if needed. 
                // Since we use revalidatePath, a full refresh is often simplest for server components,
                // but for a smooth UX we might want to manually update local state or trigger a router refresh.
                window.location.reload()
            } else {
                window.location.reload()
            }
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return;

        const result = await deleteProject(id)
        if (result.success) {
            window.location.reload()
        } else {
            alert('Failed to delete')
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

                <form action={handleSubmit} className="space-y-4" key={editingId || 'new'}>
                    <input type="hidden" name="id" value={editingId || ''} />
                    {/* Key ensures form resets when switching modes */}
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Project Title</label>
                        <input
                            name="title"
                            type="text"
                            required
                            defaultValue={editingProject?.title || ''}
                            className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-khaki-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Description</label>
                        <textarea
                            name="desc"
                            required
                            rows={3}
                            defaultValue={editingProject?.description || ''}
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
                                defaultValue={editingProject?.date || ''}
                                className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-khaki-500 outline-none"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Stack (CSV)</label>
                            <input
                                name="stack"
                                type="text"
                                placeholder="React, Node.js"
                                defaultValue={editingProject?.stack?.join(', ') || ''}
                                className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-khaki-500 outline-none"
                            />
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
