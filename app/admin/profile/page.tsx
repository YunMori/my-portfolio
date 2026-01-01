'use client'

import { updateProfile } from '@/app/actions'

export default function ProfilePage() {

    const handleProfileUpdate = async (formData: FormData) => {
        const result = await updateProfile(formData);
        if (!result.success) {
            alert('Failed to update profile');
        } else {
            alert('Profile updated!');
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-10 text-khaki-500">Edit Profile</h1>

            <section className="bg-surface p-8 rounded-2xl border border-stone-800 max-w-2xl">
                <form action={handleProfileUpdate} className="space-y-6">
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">Full Name</label>
                        <input name="name" type="text" placeholder="Yun Jong Seo" className="w-full bg-stone-900 border border-stone-700 rounded p-3 text-stone-200 focus:border-khaki-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">Role / Job Title</label>
                        <input name="role" type="text" placeholder="Full Stack Developer" className="w-full bg-stone-900 border border-stone-700 rounded p-3 text-stone-200 focus:border-khaki-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">Biography (Hero Description)</label>
                        <textarea name="bio" rows={6} placeholder="Introduction text..." className="w-full bg-stone-900 border border-stone-700 rounded p-3 text-stone-200 focus:border-khaki-500 outline-none"></textarea>
                    </div>
                    <div className="pt-4">
                        <button type="submit" className="px-8 py-3 bg-khaki-600 hover:bg-khaki-500 text-black font-bold rounded transition-colors shadow-lg shadow-khaki-900/20">
                            Save Changes
                        </button>
                    </div>
                </form>
            </section>
        </div>
    )
}
