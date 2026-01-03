'use client'

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="min-h-screen bg-main flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-stone-200 mb-2">Something went wrong!</h2>
            <p className="text-stone-500 mb-8 max-w-sm">We apologized for the inconvenience. Please try again later.</p>
            <button
                onClick={() => reset()}
                className="px-6 py-3 bg-khaki-600 text-black font-bold text-sm rounded hover:bg-khaki-500 transition-colors"
            >
                Try again
            </button>
        </div>
    )
}
