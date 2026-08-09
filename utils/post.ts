// Blog post helpers: reading time, heading slugs, and table-of-contents extraction.
// No external dependencies — keeps the blog aligned with the existing lean stack.

export type Heading = {
    level: number; // 2 for ##, 3 for ###
    text: string;
    id: string;
};

/**
 * Slugify heading text into an anchor id.
 * Keeps unicode letters (incl. Korean) and numbers; everything else becomes a dash.
 * Must stay in sync with the id injected on rendered headings so TOC links resolve.
 */
export function slugify(text: string): string {
    return text
        .trim()
        .toLowerCase()
        .replace(/[`*_~]/g, '') // strip markdown emphasis markers
        .replace(/[^\p{L}\p{N}]+/gu, '-') // non letter/number → dash
        .replace(/^-+|-+$/g, ''); // trim leading/trailing dashes
}

/**
 * URL-safe ASCII slug for post routes. Non-ASCII (incl. Korean) is dropped,
 * so `<Link>` hrefs never carry multibyte chars that double-encode on soft nav.
 * Distinct from `slugify`, which keeps Korean for in-page heading anchors.
 */
export function postSlug(text: string): string {
    return text
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '') // strip diacritics
        .toLowerCase()
        .replace(/[`*_~]/g, '') // strip markdown emphasis markers
        .replace(/[^a-z0-9]+/g, '-') // non ascii-alnum → dash
        .replace(/^-+|-+$/g, ''); // trim leading/trailing dashes
}

/**
 * Extract a nested-friendly flat list of h2/h3 headings from raw markdown,
 * skipping anything inside fenced code blocks.
 */
export function extractHeadings(content: string): Heading[] {
    if (!content) return [];
    const headings: Heading[] = [];
    let inFence = false;

    for (const line of content.split('\n')) {
        if (/^\s*```/.test(line)) {
            inFence = !inFence;
            continue;
        }
        if (inFence) continue;

        const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
        if (match) {
            const level = match[1].length;
            const text = match[2].replace(/[`*_~]/g, '').trim();
            headings.push({ level, text, id: slugify(text) });
        }
    }

    return headings;
}

/**
 * Rough reading-time estimate (in minutes). Blends latin word count with CJK
 * character count so Korean-heavy posts get a sensible number. Minimum 1 minute.
 */
export function readingTime(content: string): number {
    if (!content) return 1;

    const stripped = content
        .replace(/```[\s\S]*?```/g, ' ') // drop code blocks
        .replace(/[#>*`_~\-|]/g, ' '); // drop markdown symbols

    const words = stripped.trim().split(/\s+/).filter(Boolean).length;
    const cjkChars = (content.match(/[ㄱ-힝]/g) || []).length;

    // ~200 latin words/min; ~400 Korean chars/min (counted as 0.5 word each).
    const units = words + cjkChars * 0.5;
    return Math.max(1, Math.round(units / 200));
}

/**
 * Render a post date for display. `posts.date` is a real `date` column, so the
 * API hands back 'YYYY-MM-DD'; this is the one place that decides how it reads.
 * Formatted manually rather than via `new Date()` so a bare date string is never
 * shifted a day by the viewer's timezone.
 */
export function formatPostDate(date: string | null): string {
    if (!date) return '';
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
    return match ? `${match[1]}.${match[2]}.${match[3]}` : date;
}

/** Extract a plain string from react-markdown heading children (for id generation). */
export function nodeToText(node: unknown): string {
    if (node == null || typeof node === 'boolean') return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(nodeToText).join('');
    if (typeof node === 'object' && 'props' in node) {
        const { props } = node as { props?: { children?: unknown } };
        return nodeToText(props?.children);
    }
    return '';
}
