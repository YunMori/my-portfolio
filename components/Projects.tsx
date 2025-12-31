
interface Project {
    title: string;
    desc: string;
    date: string;
    stack: string[];
}

interface ProjectsProps {
    projects: Project[];
}

export default function Projects({ projects }: ProjectsProps) {
    return (
        <section id="projects" className="py-24 bg-main">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex justify-between items-end mb-16 fade-in-section opacity-0 translate-y-5 transition-all duration-700">
                    <div>
                        <h2 className="text-sm font-bold text-brown-500 uppercase tracking-widest mb-2">Portfolio</h2>
                        <h3 className="text-4xl font-display font-bold text-stone-100">Featured Work</h3>
                    </div>
                    <div className="text-right">
                        <span key={projects.length} className="text-5xl font-display font-bold text-stone-800 select-none animate-pulse">
                            {projects.length}
                        </span>
                        <span className="text-stone-600 text-xs uppercase tracking-wider block mt-2">Total Projects</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {projects.map((p, index) => (
                        <div
                            key={index}
                            className="group rounded-2xl overflow-hidden bg-surface border border-highlight hover:border-khaki-500 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer fade-in-section opacity-0 translate-y-5"
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <div className="h-52 bg-[#151412] relative flex items-center justify-center border-b border-stone-800">
                                <i className="fa-solid fa-code text-4xl text-stone-700 group-hover:text-khaki-500 transition-colors duration-300 group-hover:scale-110 transform"></i>
                                <div className="absolute top-4 right-4 text-xs text-stone-600 font-mono">{p.date}</div>
                            </div>
                            <div className="p-6">
                                <div className="flex flex-wrap gap-1 mb-4">
                                    {p.stack.map(s => (
                                        <span key={s} className="px-2 py-1 bg-stone-800 text-stone-400 text-[10px] font-bold uppercase tracking-wide border border-stone-700 rounded-full">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                                <h4 className="text-xl font-bold text-stone-200 mb-2 group-hover:text-khaki-400 transition-colors">{p.title}</h4>
                                <p className="text-stone-500 text-sm leading-relaxed mb-6 line-clamp-2">{p.desc}</p>
                                <div className="flex items-center text-xs font-bold text-brown-400 uppercase tracking-widest group-hover:text-khaki-500 transition-colors">
                                    View Case Study <i className="fa-solid fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
