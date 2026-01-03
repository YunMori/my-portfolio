'use client'

import Link from 'next/link'
import VisitorChart from '@/components/admin/VisitorChart'

export default function AdminDashboard() {
    return (
        <div>
            <h1 className="text-4xl font-display font-bold mb-2 text-stone-100">Welcome back.</h1>
            <p className="text-stone-500 mb-12">Select an option from the menu or quick links below to manage your portfolio content.</p>

            <div className="mb-8 p-6 rounded-2xl bg-stone-900/50 border border-stone-800">
                <h2 className="text-sm font-bold text-stone-400 mb-4 uppercase tracking-wider">Visitor Trends (Last 7 Days)</h2>
                <VisitorChart />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Link href="/admin/profile" className="group bg-surface hover:bg-stone-800 border border-stone-800 p-8 rounded-2xl transition-all hover:-translate-y-1 hover:border-khaki-500/50 hover:shadow-xl">
                    <div className="w-12 h-12 rounded-full bg-khaki-500/10 flex items-center justify-center text-khaki-500 mb-4 group-hover:bg-khaki-500 group-hover:text-black transition-colors">
                        <i className="fa-solid fa-user-pen text-xl"></i>
                    </div>
                    <h2 className="text-xl font-bold text-stone-200 mb-2">Edit Profile</h2>
                    <p className="text-sm text-stone-500 group-hover:text-stone-400">Update your name, role, bio, and social links displayed on the Hero section.</p>
                </Link>

                <Link href="/admin/projects" className="group bg-surface hover:bg-stone-800 border border-stone-800 p-8 rounded-2xl transition-all hover:-translate-y-1 hover:border-khaki-500/50 hover:shadow-xl">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4 group-hover:bg-blue-500 group-hover:text-black transition-colors">
                        <i className="fa-solid fa-folder-plus text-xl"></i>
                    </div>
                    <h2 className="text-xl font-bold text-stone-200 mb-2">Manage Projects</h2>
                    <p className="text-sm text-stone-500 group-hover:text-stone-400">Add new portfolio items, update descriptions, or change technology stacks.</p>
                </Link>
            </div>

            <div className="mt-12 p-6 rounded-xl bg-stone-900/50 border border-stone-800 text-sm text-stone-500">
                <h3 className="font-bold text-stone-300 mb-2"><i className="fa-solid fa-circle-info mr-2"></i> System Status</h3>
                <p>Connected to Supabase. Database write access restricted to authenticated administrators only.</p>
            </div>
        </div>
    )
}
