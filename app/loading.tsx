export default function Loading() {
    return (
        <div className="min-h-screen bg-main flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-khaki-500/30 border-t-khaki-500 rounded-full animate-spin"></div>
                <p className="text-stone-500 text-sm font-mono tracking-widest animate-pulse">LOADING...</p>
            </div>
        </div>
    )
}
