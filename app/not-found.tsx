import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-main flex flex-col items-center justify-center text-center p-6">
            <h2 className="text-6xl font-bold text-khaki-600 mb-4 opacity-20">404</h2>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-200 mb-4">Page Not Found</h1>
            <p className="text-stone-500 max-w-md mb-8">
                The page you are looking for doesn't exist or has been moved.
            </p>
            <Link href="/" className="px-6 py-3 bg-stone-800 text-stone-300 rounded-lg hover:bg-khaki-600 hover:text-black transition-colors font-bold text-sm">
                Return Home
            </Link>
        </div>
    )
}
