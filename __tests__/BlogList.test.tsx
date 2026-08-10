import { render, screen, within } from '@testing-library/react';
import BlogList from '@/components/blog/BlogList';
import { ContentLanguageProvider } from '@/i18n/ContentLanguage';
import { PostListItem, Category } from '@/types/database.types';

// The real provider rather than a mock: jsdom's navigator.language is en-US and
// localStorage is empty, so it settles on 'en' — the same path a first-time
// visitor takes. Tests that need Korean write the preference first.
function renderList(ui: React.ReactElement) {
    return render(<ContentLanguageProvider>{ui}</ContentLanguageProvider>);
}

const mockCategories: Category[] = [
    { id: 'cat-1', name: 'Frontend', name_en: null, slug: 'frontend', sort_order: 1 },
    { id: 'cat-2', name: '회고', name_en: 'Retrospective', slug: 'retro', sort_order: 2 },
];

const mockPosts: PostListItem[] = [
    {
        id: 'post-1',
        title: 'First Post',
        title_en: null,
        slug: 'first-post',
        description: 'About Next.js',
        description_en: null,
        categories: [
            { id: 'cat-1', name: 'Frontend', name_en: null, slug: 'frontend', sort_order: 1 },
            { id: 'cat-2', name: '회고', name_en: 'Retrospective', slug: 'retro', sort_order: 2 },
        ],
        published: true,
        date: '2026.07.01',
        readingMinutes: 3,
        readingMinutesEn: null,
    },
    {
        id: 'post-2',
        title: '두 번째 글',
        title_en: 'Second Post',
        slug: 'second-post',
        description: '수파베이스에 대하여',
        description_en: 'About Supabase',
        categories: [],
        published: true,
        date: '2026.06.01',
        readingMinutes: 1,
        readingMinutesEn: 2,
    },
];

beforeEach(() => {
    localStorage.clear();
});

describe('BlogList', () => {
    it('renders post titles and links to their slugs', () => {
        renderList(<BlogList posts={mockPosts} categories={mockCategories} activeCategory={null} />);
        const link = screen.getByText('First Post').closest('a');
        expect(link).toHaveAttribute('href', '/blog/first-post');
    });

    it('renders a badge for every category on a post', () => {
        renderList(<BlogList posts={mockPosts} categories={mockCategories} activeCategory={null} />);
        // post-1 carries both categories, so each name appears twice:
        // once as a filter pill, once as a badge. post-2 has none.
        expect(screen.getAllByText('Frontend')).toHaveLength(2);
        expect(screen.getAllByText('Retrospective')).toHaveLength(2);

        const postCard = screen.getByText('First Post').closest('a')!;
        expect(within(postCard).getByText('Frontend')).toBeInTheDocument();
        expect(within(postCard).getByText('Retrospective')).toBeInTheDocument();

        const uncategorized = screen.getByText('Second Post').closest('a')!;
        expect(within(uncategorized).queryByText('Frontend')).not.toBeInTheDocument();
    });

    // Filtering happens on the server via ?category=, so the pills are links, not buttons.
    it('links each category filter to its query string URL', () => {
        renderList(<BlogList posts={mockPosts} categories={mockCategories} activeCategory={null} />);
        expect(screen.getByText('All').closest('a')).toHaveAttribute('href', '/blog');
        expect(screen.getByRole('link', { name: 'Frontend' })).toHaveAttribute('href', '/blog?category=frontend');
        expect(screen.getByRole('link', { name: 'Retrospective' })).toHaveAttribute('href', '/blog?category=retro');
    });

    it('marks the active category pill, and "all" when no category is set', () => {
        const { rerender } = renderList(
            <BlogList posts={mockPosts} categories={mockCategories} activeCategory={null} />
        );
        expect(screen.getByText('All')).toHaveClass('bg-green-400');
        expect(screen.getByRole('link', { name: 'Frontend' })).not.toHaveClass('bg-green-400');

        rerender(
            <ContentLanguageProvider>
                <BlogList posts={mockPosts} categories={mockCategories} activeCategory="frontend" />
            </ContentLanguageProvider>
        );
        expect(screen.getByRole('link', { name: 'Frontend' })).toHaveClass('bg-green-400');
        expect(screen.getByText('All')).not.toHaveClass('bg-green-400');
    });

    it('shows empty state when there are no posts', () => {
        renderList(<BlogList posts={[]} categories={mockCategories} activeCategory="frontend" />);
        expect(screen.getByText('No posts yet. Check back soon.')).toBeInTheDocument();
    });

    it('renders the English translation when there is one, and the original when there is not', () => {
        renderList(<BlogList posts={mockPosts} categories={mockCategories} activeCategory={null} />);
        // post-2 has title_en, so English wins.
        expect(screen.getByText('Second Post')).toBeInTheDocument();
        expect(screen.getByText('About Supabase')).toBeInTheDocument();
        // post-1 has none, so it falls back to the original rather than rendering blank.
        expect(screen.getByText('First Post')).toBeInTheDocument();
        expect(screen.getByText('About Next.js')).toBeInTheDocument();
    });

    it('switches content to Korean when the reader has chosen it', async () => {
        localStorage.setItem('portfolio-lang', 'ko');
        renderList(<BlogList posts={mockPosts} categories={mockCategories} activeCategory={null} />);

        expect(await screen.findByText('두 번째 글')).toBeInTheDocument();
        expect(screen.getByText('수파베이스에 대하여')).toBeInTheDocument();
        expect(screen.queryByText('Second Post')).not.toBeInTheDocument();
        // The chrome stays English regardless.
        expect(screen.getByText('Tech Blog')).toBeInTheDocument();
        expect(screen.getByText('All')).toBeInTheDocument();
    });

    it('shows the reading time of the translation the reader is actually on', async () => {
        renderList(<BlogList posts={mockPosts} categories={mockCategories} activeCategory={null} />);
        // post-2 has an English body, so its own estimate wins in English mode.
        expect(screen.getByText('2 min read')).toBeInTheDocument();
        // post-1 has no translation, so it keeps the original's estimate.
        expect(screen.getByText('3 min read')).toBeInTheDocument();
    });

    it('marks localised text with the language actually rendered, not the one requested', () => {
        renderList(<BlogList posts={mockPosts} categories={mockCategories} activeCategory={null} />);
        // post-2 rendered its English translation.
        expect(screen.getByText('Second Post')).toHaveAttribute('lang', 'en');
        // post-1 fell back to the Korean original despite English being requested.
        expect(screen.getByText('First Post')).toHaveAttribute('lang', 'ko');
    });
});
