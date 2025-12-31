
interface TechStat {
    name: string;
    count: number;
}

interface TechStackProps {
    techStats: TechStat[];
    totalProjects: number;
}

const techIcons: { [key: string]: string } = {
    'Next.js': 'fa-brands fa-react text-stone-100',
    'React': 'fa-brands fa-react text-blue-400',
    'TypeScript': 'fa-brands fa-js text-blue-500',
    'Tailwind': 'fa-brands fa-css3-alt text-cyan-400',
    'Node.js': 'fa-brands fa-node text-green-500',
    'Supabase': 'fa-solid fa-database text-emerald-400',
    'Firebase': 'fa-solid fa-fire text-amber-500',
    'Vue': 'fa-brands fa-vuejs text-emerald-500',
    'Python': 'fa-brands fa-python text-blue-400',
    'Git': 'fa-brands fa-git-alt text-orange-500',
    'Figma': 'fa-brands fa-figma text-purple-400',
    'Socket.io': 'fa-solid fa-bolt text-yellow-200'
};

export default function TechStack({ techStats, totalProjects }: TechStackProps) {
    return (
        <section id="skills" className="py-20 bg-[#0f0f0c] border-y border-stone-900 relative">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#a3a948 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-stone-900 pb-6 fade-in-section opacity-0 translate-y-5 transition-all duration-700">
                    <div>
                        <h3 className="text-khaki-600 text-xs font-bold uppercase tracking-widest mb-2">Live Tech Stats</h3>
                        <h2 className="text-3xl font-display font-bold text-stone-100">Most Used Tech</h2>
                    </div>
                    <p className="text-stone-500 text-sm mt-2 md:mt-0">빈도수에 따라 실시간으로 재정렬됩니다.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {techStats.map((item, index) => {
                        const iconClass = techIcons[item.name] || 'fa-solid fa-code text-stone-500';
                        let rankClass = "bg-surface border-stone-800";
                        let countColor = "text-stone-500 bg-stone-800";
                        let iconColor = "text-stone-400";
                        let glow = "";

                        if (index === 0) {
                            rankClass = "bg-gradient-to-br from-surface to-[#2a2a20] border-khaki-500";
                            countColor = "text-black bg-khaki-500";
                            iconColor = "text-khaki-400";
                            glow = "shadow-[0_0_15px_rgba(163,169,72,0.1)]";
                        } else if (index === 1) {
                            rankClass = "border-brown-500 bg-surface";
                        }

                        return (
                            <div key={item.name} className={`p-5 rounded-2xl flex flex-col items-center justify-center text-center relative group border transition-all duration-300 hover:-translate-y-1 hover:border-khaki-500 hover:shadow-xl ${rankClass} ${glow}`}>
                                <div className={`text-3xl mb-3 transition-colors ${iconColor}`}>
                                    <i className={iconClass}></i>
                                </div>
                                <h4 className="font-bold text-sm text-stone-300 mb-2">{item.name}</h4>

                                {/* Progress Bar */}
                                <div className="w-full h-1 bg-stone-800 mt-1 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-khaki-600 transition-all duration-1000"
                                        style={{ width: `${Math.round((item.count / totalProjects) * 100)}%` }}
                                    ></div>
                                </div>

                                <div className="absolute top-2 right-2">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${countColor}`}>
                                        {item.count}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
