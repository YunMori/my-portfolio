/**
 * 공통 baseUrl 유틸리티
 * 환경변수 NEXT_PUBLIC_SITE_URL → NEXT_PUBLIC_VERCEL_URL → localhost 순으로 fallback
 */
export function getBaseUrl(): string {
    if (process.env.NEXT_PUBLIC_SITE_URL) {
        return process.env.NEXT_PUBLIC_SITE_URL;
    }
    if (process.env.NEXT_PUBLIC_VERCEL_URL) {
        return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    }
    return 'http://localhost:3000';
}

export const baseUrl = getBaseUrl();
