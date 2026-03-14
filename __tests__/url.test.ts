import { getBaseUrl } from '@/utils/url';

describe('getBaseUrl', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('returns localhost URL when NEXT_PUBLIC_VERCEL_URL is not set', () => {
        delete process.env.NEXT_PUBLIC_VERCEL_URL;
        expect(getBaseUrl()).toBe('http://localhost:3000');
    });

    it('returns https URL when NEXT_PUBLIC_VERCEL_URL is set', () => {
        process.env.NEXT_PUBLIC_VERCEL_URL = 'my-portfolio.vercel.app';
        expect(getBaseUrl()).toBe('https://my-portfolio.vercel.app');
    });
});
