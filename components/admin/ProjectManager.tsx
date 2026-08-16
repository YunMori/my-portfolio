'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { addProject, updateProject, deleteProject, fetchGithubRepo } from '@/app/actions/projects'
import { Project } from '@/types/database.types'

interface ProjectManagerProps {
    initialProjects: Project[]
}

function extractStackFromReadme(readmeContent: string): string {
    if (!readmeContent) return '';
    const stacks = new Set<string>();

    const knownStacks = [
        "React", "Next.js", "Vue", "Svelte", "Angular",
        "Node.js", "Express", "NestJS", "TypeScript", "JavaScript",
        "Python", "Java", "Spring", "Kotlin", "Go", "Rust",
        "C++", "C#", "PHP", "Ruby", "Swift",
        "Tailwind CSS", "TailwindCSS", "Tailwind", "Styled Components", "Sass",
        "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite",
        "Supabase", "Firebase", "AWS", "Docker", "Kubernetes", "GraphQL",
        "Prisma", "Vercel", "Framer Motion", "Redux", "Zustand", "React Query", "TRPC"
    ];

    const lowerReadme = readmeContent.toLowerCase();

    for (const stack of knownStacks) {
        const normalizedStack = (stack === "TailwindCSS" || stack === "Tailwind") ? "Tailwind CSS" : stack;
        const isAlphabetic = /^[A-Za-z]+$/.test(stack);

        if (isAlphabetic) {
            const regex = new RegExp(`\\b${stack}\\b`, 'i');
            if (regex.test(lowerReadme)) {
                stacks.add(normalizedStack);
            }
        } else {
            if (lowerReadme.includes(stack.toLowerCase())) {
                stacks.add(normalizedStack);
            }
        }
    }

    return Array.from(stacks).join(', ');
}

const EMPTY_FORM = {
    title: '',
    title_en: '',
    description: '',
    description_en: '',
    date: '',
    stack: '',
    github_link: '',
    content: '',
    content_en: '',
    // 이력서용 필드. 프로젝트는 이력서 빌더의 한 섹션이기도 해서, 역할/기간과
    // "기본 포함" 여부를 여기서 함께 관리한다. See utils/resume/buildResumeData.ts.
    role: '',
    period_start: '',
    period_end: '',
    include_in_resume_default: 'on'
}

export default function ProjectManager({ initialProjects }: ProjectManagerProps) {
    const [projects] = useState<Project[]>(initialProjects)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isFetching, setIsFetching] = useState(false)

    // Form State for Controlled Inputs. The `*_en` fields hold the optional English
    // translation of the Korean original beside them; blank means "no translation
    // yet" and the action stores null so the site falls back. See i18n/localize.ts.
    const [formData, setFormData] = useState({ ...EMPTY_FORM })

    // Update form when editingId changes
    useEffect(() => {
        if (editingId) {
            const project = projects.find(p => p.id === editingId)
            if (project) {
                setFormData({
                    title: project.title,
                    title_en: project.title_en || '',
                    description: project.description,
                    description_en: project.description_en || '',
                    date: project.date,
                    stack: project.stack.join(', '),
                    github_link: project.github_link || '',
                    content: project.content || '',
                    content_en: project.content_en || '',
                    role: project.role || '',
                    period_start: project.period_start || '',
                    period_end: project.period_end || '',
                    include_in_resume_default: project.include_in_resume_default === false ? '' : 'on'
                })
            }
        } else {
            // Reset form for new project
            setFormData({ ...EMPTY_FORM })
        }
    }, [editingId, projects])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        // 체크박스는 FormData 관례대로 'on'/'' 로 담는다 (서버 액션이 'on'을 true로 읽는다)
        const checked = (e.target as HTMLInputElement).checked
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (checked ? 'on' : '') : value }))
    }

    const handleFetchGithub = async () => {
        const url = formData.github_link.trim()
        if (!url) {
            toast.error('Please enter a GitHub URL first')
            return
        }

        setIsFetching(true)
        try {
            const result = await fetchGithubRepo(url);

            if (!result.success || !result.data) {
                console.error('Fetch failed:', result.error);
                throw new Error(result.error || 'Failed to fetch');
            }

            const data = result.data;

            // Auto-fill form
            setFormData(prev => ({
                ...prev,
                title: data.title,
                description: data.description,
                date: data.date,
                content: data.content,
                stack: extractStackFromReadme(data.content)
            }))

            toast.success('Fetched data from GitHub!')

        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : 'Failed to fetch from GitHub.')
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

        // Determine which action to run
        const action = editingId ? updateProject : addProject

        if (editingId) {
            submitData.append('id', editingId)
        }

        try {
            const result = await action(submitData)

            if (!result.success) {
                toast.error(result.error || 'Operation failed')
            } else {
                toast.success(editingId ? 'Project updated!' : 'Project added!')
                window.location.reload()
            }
        } catch (err) {
            console.error(err)
            toast.error('An unexpected error occurred')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return;

        try {
            const result = await deleteProject(id)
            if (result.success) {
                toast.success('Project deleted')
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
                                className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-green-500 outline-none"
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
                                className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-green-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">
                                Project Title <span className="text-green-600">EN</span> <span className="normal-case tracking-normal text-stone-600">(optional)</span>
                            </label>
                            <input
                                name="title_en"
                                type="text"
                                placeholder="Leave blank to reuse the original"
                                value={formData.title_en}
                                onChange={handleInputChange}
                                className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-green-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Description</label>
                            <input
                                name="description"
                                type="text"
                                placeholder="Short project description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-green-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">
                                Description <span className="text-green-600">EN</span> <span className="normal-case tracking-normal text-stone-600">(optional)</span>
                            </label>
                            <input
                                name="description_en"
                                type="text"
                                placeholder="Leave blank to reuse the original"
                                value={formData.description_en}
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
                                    placeholder="2025.01"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-green-500 outline-none"
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
                                    className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-green-500 outline-none"
                                />
                            </div>
                        </div>
                        {/* 이력서용 필드 — 웹 포트폴리오에는 나오지 않고 Resume Builder에서만 쓰인다 */}
                        <div className="border-t border-stone-800 pt-4 space-y-4">
                            <p className="text-[10px] uppercase font-bold text-stone-600 tracking-widest">
                                <i className="fa-solid fa-file-pdf mr-1"></i> Resume
                            </p>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Role</label>
                                    <input
                                        name="role"
                                        type="text"
                                        placeholder="백엔드 개발 / 팀장"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-green-500 outline-none"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Period (start ~ end)</label>
                                    <div className="flex gap-2">
                                        <input
                                            name="period_start"
                                            type="text"
                                            placeholder="2025.01"
                                            value={formData.period_start}
                                            onChange={handleInputChange}
                                            className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-green-500 outline-none"
                                        />
                                        <input
                                            name="period_end"
                                            type="text"
                                            placeholder="2025.06"
                                            value={formData.period_end}
                                            onChange={handleInputChange}
                                            className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-green-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-stone-400 cursor-pointer">
                                <input
                                    name="include_in_resume_default"
                                    type="checkbox"
                                    checked={formData.include_in_resume_default === 'on'}
                                    onChange={handleInputChange}
                                    className="accent-green-500"
                                />
                                이력서 기본 포함
                            </label>
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Detailed Content (Markdown)</label>
                            <textarea
                                name="content"
                                rows={6}
                                placeholder="# Project Details\n\nExplain your project methodology..."
                                value={formData.content}
                                onChange={handleInputChange}
                                className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-green-500 outline-none font-mono text-sm"
                            ></textarea>
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">
                                Detailed Content <span className="text-green-600">EN</span> <span className="normal-case tracking-normal text-stone-600">(optional)</span>
                            </label>
                            <textarea
                                name="content_en"
                                rows={6}
                                placeholder="Leave blank to reuse the Korean original."
                                value={formData.content_en}
                                onChange={handleInputChange}
                                className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-stone-200 focus:border-green-500 outline-none font-mono text-sm"
                            ></textarea>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={`w-full font-bold py-3 rounded transition-colors mt-2 ${editingId ? 'bg-green-600 hover:bg-green-500 text-black' : 'bg-stone-700 hover:bg-stone-600 text-white'}`}
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
                        <div key={project.id} className={`p-4 rounded-lg border flex justify-between items-start transition-all ${editingId === project.id ? 'bg-green-500/10 border-green-500' : 'bg-stone-900 border-stone-800 hover:border-stone-600'}`}>
                            <div>
                                <h3 className={`font-bold ${editingId === project.id ? 'text-green-500' : 'text-stone-200'}`}>{project.title}</h3>
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
