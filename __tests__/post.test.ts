import { slugify, postSlug, extractHeadings, readingTime, nodeToText } from '@/utils/post';

describe('slugify', () => {
    it('lowercases and dashes latin text', () => {
        expect(slugify('Hello World')).toBe('hello-world');
    });

    it('keeps Korean characters', () => {
        expect(slugify('왜 블로그인가')).toBe('왜-블로그인가');
    });

    it('strips markdown emphasis and trims dashes', () => {
        expect(slugify('  **Getting** started!  ')).toBe('getting-started');
    });
});

describe('postSlug', () => {
    it('drops Korean and keeps ascii, dash-separated', () => {
        expect(postSlug('CLI 와 git')).toBe('cli-git');
        expect(postSlug('Hello World')).toBe('hello-world');
    });

    it('returns empty when nothing ascii survives (caller adds fallback)', () => {
        expect(postSlug('왜 블로그인가')).toBe('');
    });
});

describe('extractHeadings', () => {
    it('extracts h2 and h3 with matching slugs, ignoring h1', () => {
        const md = '# Title\n\n## Section One\n\ntext\n\n### Sub A\n\n## Section Two';
        const headings = extractHeadings(md);
        expect(headings).toEqual([
            { level: 2, text: 'Section One', id: 'section-one' },
            { level: 3, text: 'Sub A', id: 'sub-a' },
            { level: 2, text: 'Section Two', id: 'section-two' },
        ]);
    });

    it('skips headings inside fenced code blocks', () => {
        const md = '## Real\n\n```\n## Not A Heading\n```\n\n## Also Real';
        expect(extractHeadings(md).map(h => h.text)).toEqual(['Real', 'Also Real']);
    });
});

describe('readingTime', () => {
    it('returns at least 1 minute', () => {
        expect(readingTime('short')).toBe(1);
        expect(readingTime('')).toBe(1);
    });

    it('scales with content length', () => {
        const long = 'word '.repeat(600);
        expect(readingTime(long)).toBeGreaterThan(1);
    });
});

describe('nodeToText', () => {
    it('flattens nested react children into a string', () => {
        const node = { props: { children: ['Hello ', { props: { children: 'World' } }] } };
        expect(nodeToText(node)).toBe('Hello World');
    });
});
