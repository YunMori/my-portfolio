import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="flex min-h-screen bg-main text-stone-200 font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-stone-800 bg-surface flex flex-col fixed h-full z-10">
                <div className="p-6 border-b border-stone-800">
                    <Link href="/admin" className="text-xl font-display font-bold text-khaki-500 tracking-tighter">
                        ADMIN PANEL
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        href="/admin"
                        className="block px-4 py-3 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors font-medium text-sm"
                    >
                        <i className="fa-solid fa-chart-line w-6 text-center"></i> Dashboard
                    </Link>
                    <div className="pt-4 pb-2 px-4 text-[10px] uppercase font-bold text-stone-600 tracking-widest">Content</div>

                    <Link
                        href="/admin/projects"
                        className="block px-4 py-3 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors font-medium text-sm"
                    >
                        <i className="fa-solid fa-folder-plus w-6 text-center"></i> Manage Projects
                    </Link>
                </nav>

                <div className="p-4 border-t border-stone-800">
                    <a href="/" className="block px-4 py-3 rounded-lg hover:bg-red-500/10 text-stone-500 hover:text-red-400 transition-colors font-medium text-sm group">
                        <i className="fa-solid fa-arrow-right-from-bracket w-6 text-center group-hover:-translate-x-1 transition-transform"></i> Exit to Site
                    </a>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-10">
                {children}
            </main>
        </div>
    )
}
