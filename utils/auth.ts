import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'

/**
 * The signed-in user, or null.
 *
 * `getUser()` validates the token against the Supabase Auth server rather than
 * trusting the cookie, so it is a network round trip. A single admin page used
 * to make three of them — middleware, the admin layout, and whichever fetcher
 * the page called. React's `cache` collapses every call within one request into
 * one, leaving the middleware's check as the only separate one.
 *
 * Deliberately not a Server Action: this is only ever called during server
 * rendering, and marking it one would publish a callable endpoint that hands
 * back the user object for no reason.
 */
export const getCurrentUser = cache(async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
})

export async function isAuthenticated() {
    return !!(await getCurrentUser())
}
