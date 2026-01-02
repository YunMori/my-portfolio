'use client'

import { Project } from '@/types/database.types';
import { useState } from 'react';

interface ProjectsProps {
    projects: Project[];
}

export default function Projects({ projects }: ProjectsProps) {
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    return (
        <section id="projects" className="py-24 bg-main relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-20 space-y-4">
                    <span className="text-khaki-500 font-bold tracking-widest text-xs uppercase">Selected Works</span>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-stone-100">
                        Recent <span className="text-stone-600">Projects</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {projects.map((p, index) => (
                        <div
                            key={index}
                            className="group rounded-2xl overflow-hidden bg-surface border border-highlight hover:border-khaki-500 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer fade-in-section opacity-0 translate-y-5 flex flex-col h-full"
                            style={{ transitionDelay: `${index * 100}ms` }}
                            onClick={() => setSelectedProject(p)}
                        >
                            <div className="h-52 bg-[#151412] relative flex items-center justify-center border-b border-stone-800 shrink-0">
                                {/* Image Placeholder or Actual Image */}
                                <div className="w-20 h-20 rounded-full bg-stone-800 flex items-center justify-center text-stone-600 group-hover:text-khaki-500 group-hover:scale-110 transition-all duration-500">
                                    <i className="fa-solid fa-code text-3xl"></i>
                                </div>
                                <div className="absolute top-4 right-4 flex gap-2">
                                    {p.stack.slice(0, 2).map(tech => (
                                        <span key={tech} className="bg-black/50 backdrop-blur-md border border-stone-800 text-[10px] px-2 py-1 rounded-full text-stone-400">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="p-8 flex flex-col flex-grow">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-stone-200 group-hover:text-khaki-500 transition-colors">
                                        {p.title}
                                    </h3>
                                    <span className="text-xs font-mono text-stone-500">{p.date}</span>
                                </div>
                                <p className="text-stone-400 text-sm leading-relaxed mb-6 flex-grow">
                                    {p.description}
                                </p>
                                <div className="flex items-center gap-2 mt-auto">
                                    <button className="text-xs font-bold text-stone-300 hover:text-white flex items-center gap-2 group-hover:gap-3 transition-all">
                                        View Case Study <i className="fa-solid fa-arrow-right text-khaki-500"></i>
                                    </button>
                                    {p.github_link && (
                                        <a href={p.github_link} target="_blank" rel="noopener noreferrer" className="ml-auto text-stone-500 hover:text-white" onClick={(e) => e.stopPropagation()}>
                                            <i className="fa-brands fa-github text-lg"></i>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Project Detail Modal */}
            {selectedProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedProject(null)}></div>
                    <div className="relative bg-[#1a1917] w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-stone-800 shadow-2xl p-8 md:p-12 animate-in fade-in zoom-in duration-300">
                        <button
                            onClick={() => setSelectedProject(null)}
                            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-white flex items-center justify-center transition-colors"
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>

                        <div className="mb-8">
                            <span className="text-khaki-500 text-xs font-bold tracking-widest uppercase mb-2 block">{selectedProject.date}</span>
                            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">{selectedProject.title}</h2>
                            <div className="flex flex-wrap gap-2 mb-8">
                                {selectedProject.stack.map(tech => (
                                    <span key={tech} className="px-3 py-1 bg-stone-800 rounded-full text-xs text-stone-300 border border-stone-700">
                                        {tech}
                                    </span>
                                ))}
                            </div>
                            {selectedProject.github_link && (
                                <a href={selectedProject.github_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-stone-300 hover:text-white border border-stone-700 px-4 py-2 rounded-lg hover:border-stone-500 transition-colors mb-8">
                                    <i className="fa-brands fa-github"></i> View Source
                                </a>
                            )}
                        </div>

                        <div className="prose prose-invert prose-stone max-w-none">
                            {/* Render content as simple text or markdown. For now, preserving whitespace. */}
                            {selectedProject.content ? (
                                <div className="whitespace-pre-wrap font-sans text-stone-300 leading-relaxed">
                                    {selectedProject.content}
                                </div>
                            ) : (
                                <p className="text-stone-500 italic">No detailed content available for this project yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
