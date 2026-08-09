import { render, screen, within } from '@testing-library/react';
import BlogList from '@/components/BlogList';
import { Post, Category } from '@/types/database.types';

jest.mock('@/context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en',
        toggleLanguage: jest.fn(),
    }),
}));

const mockCategories: Category[] = [
    { id: 'cat-1', name: 'Frontend', slug: 'frontend', sort_order: 1 },
    { id: 'cat-2', name: 'Backend', slug: 'backend', sort_order: 2 },
];

const mockPosts: Post[] = [
    {
        id: 'post-1',
        title: 'First Post',
        slug: 'first-post',
        description: 'About Next.js',
        content: '## Intro\n\nHello',
        categories: [
            { id: 'cat-1', name: 'Frontend', slug: 'frontend', sort_order: 1 },
            { id: 'cat-2', name: 'Backend', slug: 'backend', sort_order: 2 },
        ],
        published: true,
        date: '2026.07.01',
    },
    {
        id: 'post-2',
        title: 'Second Post',
        slug: 'second-post',
        description: 'About Supabase',
        content: 'Some content',
        categories: [],
        published: true,
        date: '2026.06.01',
    },
];

describe('BlogList', () => {
    it('renders post titles and links to their slugs', () => {
        render(<BlogList posts={mockPosts} categories={mockCategories} activeCategory={null} />);
        const link = screen.getByText('First Post').closest('a');
        expect(link).toHaveAttribute('href', '/blog/first-post');
    });

    it('renders a badge for every category on a post', () => {
        render(<BlogList posts={mockPosts} categories={mockCategories} activeCategory={null} />);
        // post-1 carries both categories, so each name appears twice:
        // once as a filter pill, once as a badge. post-2 has none.
        expect(screen.getAllByText('Frontend')).toHaveLength(2);
        expect(screen.getAllByText('Backend')).toHaveLength(2);

        const postCard = screen.getByText('First Post').closest('a')!;
        expect(within(postCard).getByText('Frontend')).toBeInTheDocument();
        expect(within(postCard).getByText('Backend')).toBeInTheDocument();

        const uncategorized = screen.getByText('Second Post').closest('a')!;
        expect(within(uncategorized).queryByText('Frontend')).not.toBeInTheDocument();
    });

    // Filtering happens on the server via ?category=, so the pills are links, not buttons.
    it('links each category filter to its query string URL', () => {
        render(<BlogList posts={mockPosts} categories={mockCategories} activeCategory={null} />);
        expect(screen.getByText('blog.filterAll').closest('a')).toHaveAttribute('href', '/blog');
        expect(screen.getByRole('link', { name: 'Frontend' })).toHaveAttribute('href', '/blog?category=frontend');
        expect(screen.getByRole('link', { name: 'Backend' })).toHaveAttribute('href', '/blog?category=backend');
    });

    it('marks the active category pill, and "all" when no category is set', () => {
        const { rerender } = render(
            <BlogList posts={mockPosts} categories={mockCategories} activeCategory={null} />
        );
        expect(screen.getByText('blog.filterAll')).toHaveClass('bg-green-400');
        expect(screen.getByRole('link', { name: 'Frontend' })).not.toHaveClass('bg-green-400');

        rerender(<BlogList posts={mockPosts} categories={mockCategories} activeCategory="frontend" />);
        expect(screen.getByRole('link', { name: 'Frontend' })).toHaveClass('bg-green-400');
        expect(screen.getByText('blog.filterAll')).not.toHaveClass('bg-green-400');
    });

    it('shows empty state when there are no posts', () => {
        render(<BlogList posts={[]} categories={mockCategories} activeCategory="frontend" />);
        expect(screen.getByText('blog.empty')).toBeInTheDocument();
    });
});
