'use client'

import { useEffect } from 'react'

/**
 * Fades `.fade-in-section` elements in as they scroll into view. Renders nothing.
 *
 * Works on the DOM directly rather than owning the markup, so the sections it
 * animates can stay server-rendered. Projects manages its own cards and is
 * excluded here to avoid two observers fighting over the same elements.
 */
export default function ScrollReveal() {
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('opacity-100', 'translate-y-0')
                    entry.target.classList.remove('opacity-0', 'translate-y-5')
                }
            })
        }, { threshold: 0.1 })

        // Deferred a tick: the observer has to attach after the server-rendered
        // markup is in the document, otherwise querySelectorAll finds nothing.
        const timeoutId = setTimeout(() => {
            document.querySelectorAll('.fade-in-section:not(#projects .fade-in-section)')
                .forEach(el => observer.observe(el))
        }, 100)

        return () => {
            observer.disconnect()
            clearTimeout(timeoutId)
        }
    }, [])

    return null
}
