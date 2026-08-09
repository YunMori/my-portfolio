import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase client for public, read-only queries — no cookies, no session.
 *
 * This exists to keep pages statically renderable. The cookie-backed client in
 * `./server` calls `cookies()`, and touching that API opts the whole route into
 * dynamic rendering, so every visitor would trigger a fresh database query even
 * for content that never varies per user.
 *
 * Anything public reads through here; anything that depends on who is asking
 * (the admin panel, mutations) keeps using `./server`.
 *
 * Safe because RLS decides what `anon` may see — published posts, public
 * projects — exactly as it does for a browser holding the same key.
 */
// Left untyped, like the cookie-backed and browser clients: the hand-written
// `Database` type carries no PostgREST relationship metadata, so applying it
// breaks inference on embedded selects such as `categories!inner(slug)`.
let client: ReturnType<typeof createSupabaseClient> | null = null

export function createPublicClient() {
    if (client) return client

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Supabase environment variables are not set')

    // No session to persist or refresh — this client is never signed in, and
    // leaving auto-refresh on would spawn a timer per server instance.
    client = createSupabaseClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    })
    return client
}
