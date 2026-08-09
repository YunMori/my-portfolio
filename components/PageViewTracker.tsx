'use client'

import { useEffect } from 'react'
import { incrementView } from '@/app/actions'

/**
 * Records one view per page load. Renders nothing.
 *
 * Exists as its own component so the home page can stay a server component —
 * this is the only thing on it that has to run in the browser.
 */
export default function PageViewTracker() {
    useEffect(() => {
        incrementView()
    }, [])

    return null
}
