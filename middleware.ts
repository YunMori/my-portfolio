import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/session'

/*
 * Next 16 prints a deprecation warning asking for the `proxy` convention
 * instead. Do not rename this file yet: on 16.2.10, a `proxy.ts` exporting
 * `proxy` builds without complaint but registers nothing —
 * `.next/server/middleware-manifest.json` comes out empty, so the /admin gate
 * below silently stops running. The current filename registers correctly
 * (manifest entry "/"), so this stays until the rename actually works.
 */
export async function middleware(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    /*
     * Only the routes that actually depend on a session.
     *
     * This used to match every path, so every public page view built a Supabase
     * client and tried to refresh a session anonymous visitors do not have.
     * /admin is the only area gated by auth, and it is also the only place where
     * a signed-in session needs refreshing — /login writes its cookies straight
     * from the browser client.
     */
    matcher: ['/admin/:path*'],
}
