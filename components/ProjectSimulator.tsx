
interface ProjectSimulatorProps {
    onAddProject: () => void;
}

export default function ProjectSimulator({ onAddProject }: ProjectSimulatorProps) {
    return (
        <div className="fixed bottom-10 right-10 z-50 flex flex-col items-end gap-3">
            <div className="bg-khaki-500 text-black text-[10px] font-bold px-3 py-1 mb-1 animate-bounce uppercase tracking-wide rounded-full shadow-lg">
                Test Tech Stack
            </div>
            <button
                onClick={onAddProject}
                className="w-14 h-14 bg-stone-800 hover:bg-khaki-500 text-khaki-500 hover:text-black border border-stone-700 hover:border-khaki-500 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center group"
            >
                <i className="fa-solid fa-plus text-xl group-hover:rotate-90 transition-transform"></i>
            </button>
        </div>
    );
}
